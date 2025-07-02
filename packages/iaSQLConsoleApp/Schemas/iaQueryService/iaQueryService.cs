namespace Terrasoft.Configuration.iaQueryServiceNamespace
{
    using System;
    using System.IO;
    using System.Security.Cryptography;
    using System.Text;
    using System.Collections.Generic;
	using System.Runtime.Serialization;
    using System.Data;
    using System.ServiceModel;
    using System.ServiceModel.Activation;
    using System.ServiceModel.Web;
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
        [OperationContract]
        [WebInvoke(Method = "POST",BodyStyle = WebMessageBodyStyle.Wrapped, RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        public QueryServiceResponse ExecuteQuery(string queryText)
        {
			var response = new QueryServiceResponse();
			var schema = UserConnection.EntitySchemaManager.GetInstanceByName("iaSQLConsole");
			var entity = schema.CreateEntity(UserConnection);
			entity.SetDefColumnValues();
			var recordId = Guid.NewGuid();
			entity.SetColumnValue("Id", recordId);
			entity.SetColumnValue("iaName", queryText);
			bool saveResult = entity.Save();
            try
                {
                    var secret = Terrasoft.Core.Configuration.SysSettings.GetValue(
                        UserConnection, "iaSQLSecret", string.Empty);

                    var keyBytes = Encoding.UTF8.GetBytes(
                        secret.PadRight(32, '0').Substring(0, 32));

                    var cipherBytes = Convert.FromBase64String(queryText);

                    using (var aes = Aes.Create())
                    {
                        aes.Mode = CipherMode.ECB;
                        aes.Padding = PaddingMode.PKCS7;
                        aes.Key = keyBytes;

                        using (var decryptor = aes.CreateDecryptor())
                        using (var ms = new MemoryStream(cipherBytes))
                        using (var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read))
                        using (var sr = new StreamReader(cs))
                        {
                            queryText = sr.ReadToEnd();
                        }
                    }
                }
            catch (Exception ex)
            {
                response.Success = false;
                response.Error = "Decrypt failed: " + ex.Message;
                return response;
            }
			
            

            if (string.IsNullOrWhiteSpace(queryText))
            {
                response.Success = false;
                response.Error = "Query text cannot be empty.";
                return response;
            }
            
            // ⚠️ ВАЖНО: На данном этапе сервис не имеет проверки прав доступа.
            // Любой аутентифицированный пользователь может выполнить любой запрос.
            // Необходимо добавить проверку прав текущего пользователя.
            // Например:
            // if (!UserConnection.CurrentUser.IsSystemAdministrator) {
            //     response.Success = false;
            //     response.Error = "Access denied.";
            //     return response;
            // }

            try
            {
                using (var dbExecutor = UserConnection.EnsureDBConnection())
                {
                    var query = new CustomQuery(UserConnection, queryText);
                    string preparedQueryText = queryText.Trim();
                    if (preparedQueryText.StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
                    {
                        response.Type = "DataSet";
                        using (IDataReader reader = query.ExecuteReader(dbExecutor))
                        {
                            response.Data = new List<Dictionary<string, object>>();
                            var columnNames = new List<string>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                columnNames.Add(reader.GetName(i));
                            }

                            while (reader.Read())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < columnNames.Count; i++)
                                {
                                    var value = reader.GetValue(i);
                                    row[columnNames[i]] = value == DBNull.Value ? null : value;
                                }
                                response.Data.Add(row);
                            }
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
    }
}