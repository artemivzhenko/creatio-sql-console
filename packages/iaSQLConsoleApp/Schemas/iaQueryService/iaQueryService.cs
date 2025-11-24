namespace Terrasoft.Configuration.iaQueryServiceNamespace
{
    using System;
    using System.Collections.Generic;
    using System.Data;
    using System.Runtime.Serialization;
    using System.ServiceModel;
    using System.ServiceModel.Activation;
    using System.ServiceModel.Web;
    using System.Text.RegularExpressions;
    using Terrasoft.Core;
    using Terrasoft.Core.DB;
    using Terrasoft.Web.Common;

    [DataContract]
    public class QueryServiceResponse
    {
        [DataMember(Name = "success")]
        public bool Success { get; set; } = true;

        [DataMember(Name = "type")]
        public string Type { get; set; }

        [DataMember(Name = "data", EmitDefaultValue = false)]
        public List<Dictionary<string, object>> Data { get; set; }

        [DataMember(Name = "rowsAffected", EmitDefaultValue = false)]
        public int? RowsAffected { get; set; }

        [DataMember(Name = "error", EmitDefaultValue = false)]
        public string Error { get; set; }
    }

    [ServiceContract(Name = "iaQueryService")]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
    public class iaQueryService : BaseService
    {
        private const int MaxRows = 5000;

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

            try
            {
                SaveQueryIfNotExists(queryText);
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Error = "Failed to save query: " + ex.Message;
                return response;
            }

            try
            {
                using (var dbExecutor = UserConnection.EnsureDBConnection())
                {
                    var query = new CustomQuery(UserConnection, preparedQueryText);

                    if (preparedQueryText.StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
                    {
                        response.Type = "DataSet";
                        response.Data = new List<Dictionary<string, object>>();

                        using (IDataReader reader = query.ExecuteReader(dbExecutor))
                        {
                            var columnNames = new List<string>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                columnNames.Add(reader.GetName(i));
                            }

                            int rowCount = 0;
                            bool limitExceeded = false;
                            var rows = new List<Dictionary<string, object>>();

                            while (reader.Read())
                            {
                                rowCount++;
                                if (rowCount > MaxRows)
                                {
                                    limitExceeded = true;
                                    break;
                                }

                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < columnNames.Count; i++)
                                {
                                    object value = reader.GetValue(i);
                                    row[columnNames[i]] = value == DBNull.Value ? null : value;
                                }
                                rows.Add(row);
                            }

                            if (limitExceeded)
                            {
                                response.Success = false;
                                response.Type = null;
                                response.Data = null;
                                response.RowsAffected = null;
                                response.Error = $"Result set exceeds maximum allowed size of {MaxRows} rows. Please narrow your query.";
                                return response;
                            }

                            response.Data = rows;
                        }
                    }
                    else
                    {
                        response.Type = "NonQuery";
                        int affectedRows = query.Execute(dbExecutor);
                        response.RowsAffected = affectedRows;
                    }
                }
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Error = ex.ToString();
            }

            return response;
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

        private void SaveQueryIfNotExists(string queryText)
        {
            var select = new Select(UserConnection)
                    .Column(Func.Count(Column.Asterisk()))
                    .From("iaSQLConsole")
                    .Where("iaName").IsEqual(Column.Parameter(queryText)) as Select;

            int existingCount = select.ExecuteScalar<int>();

            if (existingCount > 0)
            {
                return;
            }

            Guid id = Guid.NewGuid();
            Guid currentUserId = UserConnection.CurrentUser.ContactId;
            DateTime now = DateTime.UtcNow;

            new Insert(UserConnection)
                .Into("iaSQLConsole")
                .Set("Id", Column.Parameter(id))
                .Set("iaName", Column.Parameter(queryText))
                .Set("CreatedOn", Column.Parameter(now))
                .Set("CreatedById", Column.Parameter(currentUserId))
                .Execute();
        }
    }
}
