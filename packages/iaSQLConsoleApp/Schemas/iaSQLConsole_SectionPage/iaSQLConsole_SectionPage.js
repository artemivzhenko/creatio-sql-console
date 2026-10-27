define("iaSQLConsole_SectionPage", /**SCHEMA_DEPS*/["@creatio-devkit/common"]/**SCHEMA_DEPS*/, function/**SCHEMA_ARGS*/(sdk)/**SCHEMA_ARGS*/ {
	return {
		viewConfigDiff: /**SCHEMA_VIEW_CONFIG_DIFF*/[
			{
				"operation": "merge",
				"name": "PageTitle",
				"values": {
					"caption": "#MacrosTemplateString(#ResourceString(PageTitle_caption)#)#",
					"visible": true,
					"headingLevel": "label"
				}
			},
			{
				"operation": "remove",
				"name": "AddButton"
			},
			{
				"operation": "remove",
				"name": "DataImportButton"
			},
			{
				"operation": "remove",
				"name": "MenuItem_ImportFromExcel"
			},
			{
				"operation": "remove",
				"name": "OpenLandingDesigner"
			},
			{
				"operation": "remove",
				"name": "ActionButton"
			},
			{
				"operation": "remove",
				"name": "MenuItem_ExportToExcel"
			},
			{
				"operation": "remove",
				"name": "LeftFilterContainer"
			},
			{
				"operation": "remove",
				"name": "LeftFilterContainerInner"
			},
			{
				"operation": "remove",
				"name": "FolderTreeActions"
			},
			{
				"operation": "remove",
				"name": "LookupQuickFilterByTag"
			},
			{
				"operation": "remove",
				"name": "SearchFilter"
			},
			{
				"operation": "remove",
				"name": "RightFilterContainer"
			},
			{
				"operation": "remove",
				"name": "DataTable_Summaries"
			},
			{
				"operation": "remove",
				"name": "RefreshButton"
			},
			{
				"operation": "remove",
				"name": "MainButtonToggleGroup"
			},
			{
				"operation": "remove",
				"name": "FolderTree"
			},
			{
				"operation": "remove",
				"name": "MainTabPanel"
			},
			{
				"operation": "remove",
				"name": "ListTabContainer"
			},
			{
				"operation": "remove",
				"name": "ListContainer"
			},
			{
				"operation": "remove",
				"name": "DataTable"
			},
			{
				"operation": "remove",
				"name": "DashboardsTabContainer"
			},
			{
				"operation": "remove",
				"name": "DashboardsContainer"
			},
			{
				"operation": "remove",
				"name": "Dashboards"
			},
			{
				"operation": "insert",
				"name": "ExecuteButton",
				"values": {
					"type": "crt.Button",
					"caption": "Execute",
					"color": "accent",
					"disabled": false,
					"size": "large",
					"iconPosition": "only-text",
					"visible": true,
					"clicked": {
						"request": "ia.ExecuteSQLQueryRequest",
						"params": {}
					}
				},
				"parentName": "ActionButtonsContainer",
				"propertyName": "items",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "SaveSQLButton",
				"values": {
					"type": "crt.Button",
					"caption": "Save SQL",
					"color": "default",
					"disabled": false,
					"size": "large",
					"iconPosition": "left-icon",
					"visible": true,
					"icon": "import-data-button-icon",
					"clicked": {
						"request": "ia.SaveSQLQueryRequest",
						"params": {}
					}
				},
				"parentName": "ActionButtonsContainer",
				"propertyName": "items",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "HelpButton",
				"values": {
					"type": "crt.Button",
					"caption": "Help",
					"color": "default",
					"disabled": false,
					"size": "large",
					"iconPosition": "left-icon",
					"visible": true,
					"icon": "open-button-icon",
					"clicked": {
						"request": "crt.OpenPageRequest",
						"params": {
							"schemaName": "iaHelpMiniPage"
						}
					},
					"clickMode": "default"
				},
				"parentName": "ActionButtonsContainer",
				"propertyName": "items",
				"index": 2
			},
			{
				"operation": "insert",
				"name": "Button_w4y6m58",
				"values": {
					"type": "crt.Button",
					"caption": "#ResourceString(Button_w4y6m58_caption)#",
					"color": "default",
					"disabled": false,
					"size": "large",
					"iconPosition": "left-icon",
					"visible": true,
					"icon": "business-process",
					"menuItems": [],
					"clickMode": "menu"
				},
				"parentName": "ActionButtonsContainer",
				"propertyName": "items",
				"index": 3
			},
			{
				"operation": "insert",
				"name": "MenuItemQueryLogs",
				"values": {
					"type": "crt.MenuItem",
					"caption": "Query logs",
					"visible": true,
					"clicked": {
						"request": "crt.OpenPageRequest",
						"params": {
							"schemaName": "iaSQLLog_ListPage"
						}
					}
				},
				"parentName": "Button_w4y6m58",
				"propertyName": "menuItems",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "MenuItemExportLogs",
				"values": {
					"type": "crt.MenuItem",
					"caption": "Export logs",
					"visible": true,
					"clicked": {
						"request": "crt.OpenPageRequest",
						"params": {
							"schemaName": "iaSQLExportLog_ListPage"
						}
					}
				},
				"parentName": "Button_w4y6m58",
				"propertyName": "menuItems",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "ExportButton",
				"values": {
					"type": "crt.Button",
					"caption": "Export",
					"color": "default",
					"disabled": false,
					"size": "large",
					"iconPosition": "left-icon",
					"visible": true,
					"icon": "upload-button-icon",
					"menuItems": [],
					"clickMode": "menu"
				},
				"parentName": "ActionButtonsContainer",
				"propertyName": "items",
				"index": 4
			},
			{
				"operation": "insert",
				"name": "MenuItemExportCSV",
				"values": {
					"type": "crt.MenuItem",
					"caption": "CSV",
					"visible": true,
					"clicked": {
						"request": "ia.ExportToCSVRequest",
						"params": {}
					}
				},
				"parentName": "ExportButton",
				"propertyName": "menuItems",
				"index": 0
			},
			{
				"operation": "insert",
				"name": "MenuItemExcelExport",
				"values": {
					"type": "crt.MenuItem",
					"caption": "Excel",
					"visible": true,
					"clicked": {
						"request": "ia.ExportToExcelRequest",
						"params": {}
					}
				},
				"parentName": "ExportButton",
				"propertyName": "menuItems",
				"index": 1
			},
			{
				"operation": "insert",
				"name": "SQLConsole",
				"values": {
					"type": "ia.SqlConsole",
					"sqlQuery": "$PageParameters_SQLQuery",
					"queryResult": "$PageParameters_QueryResult",
					"executeQuery": {
						"request": "ia.ExecuteSQLQueryRequest",
						"params": {}
					},
					"saveQuery": {
						"request": "ia.SaveSQLQueryRequest",
						"params": {}
					},
					"layoutConfig": {
						"row": 1,
						"rowSpan": 30,
						"column": 1,
						"colSpan": 10
					}
				},
				"parentName": "SectionContentWrapper",
				"propertyName": "items",
				"index": 0
			}
		]/**SCHEMA_VIEW_CONFIG_DIFF*/,
		viewModelConfigDiff: /**SCHEMA_VIEW_MODEL_CONFIG_DIFF*/[
			{
				"operation": "merge",
				"path": [
					"attributes"
				],
				"values": {
					"PageParameters_SQLQuery": {
						"modelConfig": {
							"path": "PageParameters.SQLQuery"
						}
					},
					"PageParameters_QueryResult": {}
				}
			},
			{
				"operation": "merge",
				"path": [
					"attributes",
					"Items",
					"viewModelConfig",
					"attributes"
				],
				"values": {
					"PDS_iaName": {
						"modelConfig": {
							"path": "PDS.iaName"
						}
					},
					"PDS_CreatedOn": {
						"modelConfig": {
							"path": "PDS.CreatedOn"
						}
					},
					"PDS_CreatedBy": {
						"modelConfig": {
							"path": "PDS.CreatedBy"
						}
					}
				}
			},
			{
				"operation": "merge",
				"path": [
					"attributes",
					"Items",
					"modelConfig"
				],
				"values": {
					"filterAttributes": []
				}
			},
			{
				"operation": "merge",
				"path": [
					"attributes",
					"ItemsSorting"
				],
				"values": {
					"modelConfig": {}
				}
			},
			{
				"operation": "merge",
				"path": [
					"attributes",
					"FolderTree_visible"
				],
				"values": {
					"modelConfig": {}
				}
			}
		]/**SCHEMA_VIEW_MODEL_CONFIG_DIFF*/,
		modelConfigDiff: /**SCHEMA_MODEL_CONFIG_DIFF*/[
			{
				"operation": "merge",
				"path": [
					"dataSources",
					"PDS",
					"config"
				],
				"values": {
					"entitySchemaName": "iaSQLConsole"
				}
			}
		]/**SCHEMA_MODEL_CONFIG_DIFF*/,
		handlers: /**SCHEMA_HANDLERS*/[
			{
				request: "ia.SaveSQLQueryRequest",
				handler: async (request, next) => {
					const query = await request.$context.PageParameters_SQLQuery;

					if (!query?.trim()) {
						return next?.handle(request);
					}

					const blob = new Blob([query], { type: 'text/plain;charset=utf-8;' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = 'query.sql';
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);

					return next?.handle(request);
				},
			},
			{
				request: "ia.ExportToCSVRequest",
				handler: async (request, next) => {
					const showError = (message) => new sdk.DialogService().open({
						title: 'CSV export',
						message,
						actions: [{ key: 'OK', config: { caption: 'OK', color: 'primary' } }]
					});

					const rightsService = new sdk.RightsService();
					const canExport = await rightsService.getCanExecuteOperation('iaCanExportFromSQLConsole');
					if (!canExport) {
						await showError('You are not allowed to export from SQL console.');
						return next?.handle(request);
					}

					const result = await request.$context.PageParameters_QueryResult;
					const csvQuery = await request.$context.PageParameters_SQLQuery;

					if (!result?.rows?.length) {
						await showError('Nothing to export: run a SELECT query that returns rows first.');
						return next?.handle(request);
					}

					const formatVal = (val) => {
						if (typeof val === 'string' && val.startsWith('/Date(') && val.endsWith(')/')) {
							const plus = val.indexOf('+', 6);
							const ms = parseInt(plus > 0 ? val.slice(6, plus) : val.slice(6, val.length - 2), 10);
							const d = new Date(ms);
							return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
						}
						return val ?? '';
					};

					const lines = [result.columns.join(',')];

					for (const row of result.rows) {
						lines.push(row.map(v => `"${formatVal(v).toString().replace(/"/g, '""')}"`).join(','));
					}

					const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = 'query_result.csv';
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);

				try {
					const exportLog = await sdk.Model.create('iaExportLog');
					await exportLog.insert({ iaQuery: csvQuery, iaPreview: csvQuery.substring(0, 200), iaRowNumber: result.rows.length });
				} catch (e) {}

				return next?.handle(request);
				},
			},
			{
				request: "ia.ExportToExcelRequest",
				handler: async (request, next) => {
					const showError = (message) => new sdk.DialogService().open({
						title: 'Excel export',
						message,
						actions: [{ key: 'OK', config: { caption: 'OK', color: 'primary' } }]
					});

					const rightsService = new sdk.RightsService();
					const canExport = await rightsService.getCanExecuteOperation('iaCanExportFromSQLConsole');
					if (!canExport) {
						await showError('You are not allowed to export from SQL console.');
						return next?.handle(request);
					}

					const query = await request.$context.PageParameters_SQLQuery;

					if (!query?.trim()) {
						return next?.handle(request);
					}

					try {
						const httpClientService = new sdk.HttpClientService();
						const resp = await httpClientService.post('/rest/iaQueryService/ExportToExcel', { queryText: query });
						const result = resp?.body?.ExportToExcelResult;

						if (!result?.success || !result?.fileBase64) {
							await showError(result?.error || 'Export failed.');
						} else {
							const bytes = Uint8Array.from(atob(result.fileBase64), c => c.charCodeAt(0));
							const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
							const url = URL.createObjectURL(blob);
							const a = document.createElement('a');
							a.href = url;
							a.download = 'query_result.xlsx';
							document.body.appendChild(a);
							a.click();
							document.body.removeChild(a);
							URL.revokeObjectURL(url);
						}
					} catch (e) {
						await showError(e?.message ?? 'Network error');
					}

					return next?.handle(request);
				},
			},
			{
				request: "ia.ExecuteSQLQueryRequest",
				handler: async (request, next) => {
					const httpClientService = new sdk.HttpClientService();
					const query = await request.$context.PageParameters_SQLQuery;

					if (!query || !query.trim()) {
						return next?.handle(request);
					}

					request.$context.PageParameters_QueryResult = { pending: true };

					try {
						const resp = await httpClientService.post(
							'/rest/iaQueryService/ExecuteQuery',
							{ queryText: query },
							{}
						);
						const result = resp?.body?.ExecuteQueryResult ?? resp?.body ?? resp;
						request.$context.PageParameters_QueryResult = null;
						request.$context.PageParameters_QueryResult = result;
					} catch (e) {
						request.$context.PageParameters_QueryResult = null;
						request.$context.PageParameters_QueryResult = {
							success: false,
							type: 'NonQuery',
							error: e?.message ?? 'Network error'
						};
					}

					return next?.handle(request);
				}
			}
		]/**SCHEMA_HANDLERS*/,
		converters: /**SCHEMA_CONVERTERS*/{}/**SCHEMA_CONVERTERS*/,
		validators: /**SCHEMA_VALIDATORS*/{}/**SCHEMA_VALIDATORS*/
	};
});