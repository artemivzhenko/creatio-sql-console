namespace Terrasoft.Configuration.iaQueryServiceNamespace
{
    using System;
    using System.Collections.Generic;
    using System.Data;
    using System.Globalization;
    using System.IO;
    using System.IO.Compression;
    using System.Runtime.Serialization;
    using System.ServiceModel;
    using System.ServiceModel.Activation;
    using System.ServiceModel.Web;
    using System.Text;
    using System.Text.RegularExpressions;
    using Terrasoft.Core;
    using Terrasoft.Core.DB;
    using Terrasoft.Web.Common;

    [DataContract]
    public class ExportToExcelResponse
    {
        [DataMember(Name = "success")]
        public bool Success { get; set; } = true;

        [DataMember(Name = "fileBase64", EmitDefaultValue = false)]
        public string FileBase64 { get; set; }

        [DataMember(Name = "error", EmitDefaultValue = false)]
        public string Error { get; set; }
    }

    [DataContract]
    public class QueryServiceResponse
    {
        [DataMember(Name = "success")]
        public bool Success { get; set; } = true;

        [DataMember(Name = "type")]
        public string Type { get; set; }

        [DataMember(Name = "columns", EmitDefaultValue = false)]
        public List<string> Columns { get; set; }

        [DataMember(Name = "rows", EmitDefaultValue = false)]
        public List<object[]> Rows { get; set; }

        [DataMember(Name = "truncated", EmitDefaultValue = false)]
        public bool Truncated { get; set; }

        [DataMember(Name = "rowsAffected", EmitDefaultValue = false)]
        public int? RowsAffected { get; set; }

        [DataMember(Name = "error", EmitDefaultValue = false)]
        public string Error { get; set; }
    }

    [ServiceContract(Name = "iaQueryService")]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
    public class iaQueryService : BaseService
    {
        private const string MaxRowsSetting = "iaSQLConsoleMaxRows";
        private const string QueryTimeoutSetting = "iaSQLConsoleQueryTimeout";
        private const int DefaultMaxRows = 5000;
        private const int DefaultQueryTimeoutSec = 60;

        private static readonly Regex LiteralsAndComments = new Regex(
            @"'(?:[^']|'')*'|""(?:[^""]|"""")*""|--[^\n]*|/\*[\s\S]*?\*/", RegexOptions.Compiled);
        private static readonly Regex ReadQueryStart = new Regex(
            @"^\(*\s*(SELECT|WITH)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        // Characters not allowed in XML 1.0; they make the xlsx unreadable.
        private static readonly Regex InvalidXmlChars = new Regex(
            @"[^\x09\x0A\x0D\x20-�]", RegexOptions.Compiled);

        [OperationContract]
        [WebInvoke(
            Method = "POST",
            BodyStyle = WebMessageBodyStyle.Wrapped,
            RequestFormat = WebMessageFormat.Json,
            ResponseFormat = WebMessageFormat.Json)]
        public QueryServiceResponse ExecuteQuery(string queryText)
        {
            var response = new QueryServiceResponse();

            if (!UserConnection.DBSecurityEngine.GetCanExecuteOperation("CanUseSQLConsole"))
            {
                response.Success = false;
                response.Error = "Access denied: you are not allowed to use SQL console.";
                return response;
            }

            if (string.IsNullOrWhiteSpace(queryText))
            {
                response.Success = false;
                response.Error = "Query text cannot be empty.";
                return response;
            }

            string preparedQueryText = queryText.Trim();

            if (ContainsDangerousCommand(preparedQueryText, out string foundCommand))
            {
                response.Success = false;
                response.Error = $"Command '{foundCommand}' is not allowed in SQL console.";
                return response;
            }

            Guid logId = LogQueryStart(preparedQueryText);
            string errorText = null;

            try
            {
                using (var dbExecutor = UserConnection.EnsureDBConnection())
                {
                    dbExecutor.CommandTimeout = GetPositiveSetting(QueryTimeoutSetting, DefaultQueryTimeoutSec);

                    if (IsReadQuery(preparedQueryText))
                    {
                        response.Type = "DataSet";
                        response.Columns = new List<string>();
                        response.Rows = new List<object[]>();
                        response.Truncated = ReadRows(dbExecutor, preparedQueryText,
                            GetPositiveSetting(MaxRowsSetting, DefaultMaxRows), response.Columns, response.Rows);
                    }
                    else
                    {
                        response.Type = "NonQuery";
                        response.RowsAffected = new CustomQuery(UserConnection, preparedQueryText).Execute(dbExecutor);
                    }
                }
            }
            catch (Exception ex)
            {
                errorText = ex.ToString();
                response.Success = false;
                response.Columns = null;
                response.Rows = null;
                response.Truncated = false;
                response.Error = ex.Message;
            }
            finally
            {
                LogQueryEnd(logId, errorText);
            }

            return response;
        }

        [OperationContract]
        [WebInvoke(
            Method = "POST",
            BodyStyle = WebMessageBodyStyle.Wrapped,
            RequestFormat = WebMessageFormat.Json,
            ResponseFormat = WebMessageFormat.Json)]
        public ExportToExcelResponse ExportToExcel(string queryText)
        {
            var response = new ExportToExcelResponse();

            if (!UserConnection.DBSecurityEngine.GetCanExecuteOperation("CanUseSQLConsole") ||
                !UserConnection.DBSecurityEngine.GetCanExecuteOperation("iaCanExportFromSQLConsole"))
            {
                response.Success = false;
                response.Error = "Access denied: you are not allowed to export from SQL console.";
                return response;
            }

            if (string.IsNullOrWhiteSpace(queryText) || !IsReadQuery(queryText))
            {
                response.Success = false;
                response.Error = "Only a single SELECT query is supported for Excel export.";
                return response;
            }

            string prepared = queryText.Trim();

            if (ContainsDangerousCommand(prepared, out string foundCommand))
            {
                response.Success = false;
                response.Error = $"Command '{foundCommand}' is not allowed.";
                return response;
            }

            int maxRows = GetPositiveSetting(MaxRowsSetting, DefaultMaxRows);
            var columns = new List<string>();
            var rows = new List<object[]>();

            try
            {
                using (var dbExecutor = UserConnection.EnsureDBConnection())
                {
                    dbExecutor.CommandTimeout = GetPositiveSetting(QueryTimeoutSetting, DefaultQueryTimeoutSec);
                    if (ReadRows(dbExecutor, prepared, maxRows, columns, rows))
                    {
                        response.Success = false;
                        response.Error = $"Result set exceeds maximum allowed size of {maxRows} rows. Please narrow your query.";
                        return response;
                    }
                }
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Error = ex.Message;
                return response;
            }

            byte[] xlsx = BuildXlsx(columns, rows);
            response.FileBase64 = Convert.ToBase64String(xlsx);
            LogExport(prepared, rows.Count);
            return response;
        }

        private bool IsReadQuery(string queryText)
        {
            string code = LiteralsAndComments.Replace(queryText, " ").Trim().TrimEnd(';');
            // A second statement after a SELECT is not a read: it goes through the regular execute path.
            return !code.Contains(";") && ReadQueryStart.IsMatch(code);
        }

        // Runs a read query in a transaction that is always rolled back,
        // so functions with side effects called from a SELECT change nothing.
        // Returns true when the result has more than maxRows rows (only maxRows are read).
        private bool ReadRows(DBExecutor dbExecutor, string queryText, int maxRows, List<string> columns, List<object[]> rows)
        {
            dbExecutor.StartTransaction();
            try
            {
                if (UserConnection.DBEngine.GetType().Name.ToUpperInvariant().Contains("POSTGRE"))
                {
                    new CustomQuery(UserConnection, "SET TRANSACTION READ ONLY").Execute(dbExecutor);
                }

                using (IDataReader reader = new CustomQuery(UserConnection, queryText).ExecuteReader(dbExecutor))
                {
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        columns.Add(reader.GetName(i));
                    }

                    while (reader.Read())
                    {
                        if (rows.Count == maxRows)
                        {
                            return true;
                        }

                        var row = new object[reader.FieldCount];
                        reader.GetValues(row);
                        for (int i = 0; i < row.Length; i++)
                        {
                            if (row[i] == DBNull.Value) row[i] = null;
                        }
                        rows.Add(row);
                    }
                }
                return false;
            }
            finally
            {
                dbExecutor.RollbackTransaction();
            }
        }

        private int GetPositiveSetting(string code, int defaultValue)
        {
            int value = Terrasoft.Core.Configuration.SysSettings.GetValue(UserConnection, code, defaultValue);
            return value > 0 ? value : defaultValue;
        }

        private static string Preview(string queryText) =>
            queryText.Length > 200 ? queryText.Substring(0, 200) : queryText;

        private void LogExport(string queryText, int rowCount)
        {
            try
            {
                new Insert(UserConnection)
                    .Into("iaExportLog")
                    .Set("Id", Column.Parameter(Guid.NewGuid()))
                    .Set("CreatedOn", Column.Parameter(DateTime.UtcNow))
                    .Set("CreatedById", Column.Parameter(UserConnection.CurrentUser.ContactId))
                    .Set("iaQuery", Column.Parameter(queryText))
                    .Set("iaPreview", Column.Parameter(Preview(queryText)))
                    .Set("iaRowNumber", Column.Parameter(rowCount))
                    .Execute();
            }
            catch { /* logging must not break the export */ }
        }

        private static byte[] BuildXlsx(List<string> columns, List<object[]> rows)
        {
            using (var ms = new MemoryStream())
            {
                using (var archive = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
                {
                    WriteZipEntry(archive, "[Content_Types].xml",
                        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                        "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
                        "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
                        "<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
                        "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>" +
                        "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
                        "</Types>");

                    WriteZipEntry(archive, "_rels/.rels",
                        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                        "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
                        "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>" +
                        "</Relationships>");

                    WriteZipEntry(archive, "xl/workbook.xml",
                        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                        "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">" +
                        "<sheets><sheet name=\"Sheet1\" sheetId=\"1\" r:id=\"rId1\"/></sheets>" +
                        "</workbook>");

                    WriteZipEntry(archive, "xl/_rels/workbook.xml.rels",
                        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                        "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
                        "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>" +
                        "</Relationships>");

                    WriteZipEntry(archive, "xl/worksheets/sheet1.xml", BuildSheetXml(columns, rows));
                }
                return ms.ToArray();
            }
        }

        private static void WriteZipEntry(ZipArchive archive, string entryName, string content)
        {
            var entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);
            using (var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false)))
                writer.Write(content);
        }

        private static string BuildSheetXml(List<string> columns, List<object[]> rows)
        {
            var sb = new StringBuilder();
            sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
            sb.Append("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">");
            sb.Append("<sheetData>");

            sb.Append("<row r=\"1\">");
            for (int c = 0; c < columns.Count; c++)
            {
                string cellRef = ColLetter(c) + "1";
                sb.Append($"<c r=\"{cellRef}\" t=\"inlineStr\"><is><t>{XmlEscape(columns[c])}</t></is></c>");
            }
            sb.Append("</row>");

            for (int r = 0; r < rows.Count; r++)
            {
                int rowNum = r + 2;
                sb.Append($"<row r=\"{rowNum}\">");
                object[] rowData = rows[r];
                for (int c = 0; c < rowData.Length; c++)
                {
                    string cellRef = ColLetter(c) + rowNum;
                    object val = rowData[c];
                    if (val == null)
                    {
                        sb.Append($"<c r=\"{cellRef}\"/>");
                    }
                    else if (val is int || val is long || val is short ||
                             val is decimal || val is double || val is float)
                    {
                        sb.Append($"<c r=\"{cellRef}\"><v>{Convert.ToString(val, CultureInfo.InvariantCulture)}</v></c>");
                    }
                    else
                    {
                        sb.Append($"<c r=\"{cellRef}\" t=\"inlineStr\"><is><t>{XmlEscape(Convert.ToString(val, CultureInfo.InvariantCulture))}</t></is></c>");
                    }
                }
                sb.Append("</row>");
            }

            sb.Append("</sheetData></worksheet>");
            return sb.ToString();
        }

        private static string ColLetter(int index)
        {
            string result = "";
            do
            {
                result = (char)('A' + index % 26) + result;
                index = index / 26 - 1;
            } while (index >= 0);
            return result;
        }

        private static string XmlEscape(string value)
        {
            if (string.IsNullOrEmpty(value)) return "";
            return InvalidXmlChars.Replace(value, "")
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;")
                .Replace("'", "&apos;");
        }

        private bool ContainsDangerousCommand(string queryText, out string foundCommand)
        {
            string[] dangerousCommands = new[]
            {
                "DROP",
                "TRUNCATE",
                "DELETE"
            };

            string upper = queryText.ToUpperInvariant();

            foreach (string cmd in dangerousCommands)
            {
                var pattern = $@"\b{cmd}\b";
                if (Regex.IsMatch(upper, pattern, RegexOptions.CultureInvariant))
                {
                    foundCommand = cmd;
                    return true;
                }
            }

            foundCommand = null;
            return false;
        }

        private Guid LogQueryStart(string queryText)
        {
            Guid id = Guid.NewGuid();
            DateTime now = DateTime.UtcNow;
            string ip = UserConnection.CurrentUser.ClientIP ?? string.Empty;

            try
            {
                new Insert(UserConnection)
                    .Into("iaSQLConsole")
                    .Set("Id", Column.Parameter(id))
                    .Set("CreatedOn", Column.Parameter(now))
                    .Set("CreatedById", Column.Parameter(UserConnection.CurrentUser.ContactId))
                    .Set("iaName", Column.Parameter(queryText))
                    .Set("iaPreview", Column.Parameter(Preview(queryText)))
                    .Set("iaStart", Column.Parameter(now))
                    .Set("iaIpAddress", Column.Parameter(ip))
                    .Execute();
            }
            catch { /* logging must not break query execution */ }

            return id;
        }

        private void LogQueryEnd(Guid id, string errorText)
        {
            try
            {
                var update = new Update(UserConnection, "iaSQLConsole")
                    .Set("iaEnd", Column.Parameter(DateTime.UtcNow));

                if (!string.IsNullOrEmpty(errorText))
                    update.Set("iaException", Column.Parameter(errorText));

                update.Where("Id").IsEqual(Column.Parameter(id));
                update.Execute();
            }
            catch { }
        }
    }
}
