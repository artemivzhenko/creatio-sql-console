define("iaSQLExportLog_ListPage", /**SCHEMA_DEPS*/[]/**SCHEMA_DEPS*/, function/**SCHEMA_ARGS*/()/**SCHEMA_ARGS*/ {
	return {
		viewConfigDiff: /**SCHEMA_VIEW_CONFIG_DIFF*/[
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
				"operation": "merge",
				"name": "DataTable",
				"values": {
					"columns": [
						{
							"id": "4c1d2a6e-8f3b-4e0a-9b7d-1a2e3f4b5c6d",
							"code": "PDS_CreatedBy",
							"caption": "Created by",
							"dataValueType": 10
						},
						{
							"id": "5d2e3b7f-904c-4f1b-8c8e-2b3f4a5c6d7e",
							"code": "PDS_CreatedOn",
							"caption": "Created on",
							"dataValueType": 7,
							"width": 137
						},
						{
							"id": "6e3f4c80-a15d-4a2c-9d9f-3c4a5b6d7e8f",
							"code": "PDS_iaRowNumber",
							"caption": "Row number",
							"dataValueType": 4
						},
						{
							"id": "7f405d91-b26e-4b3d-8ea0-4d5b6c7e8f90",
							"code": "PDS_iaPreview",
							"caption": "Name",
							"dataValueType": 28
						}
					],
					"features": {
						"rows": {
							"selection": {
								"enable": true,
								"multiple": true
							}
						},
						"editable": {
							"enable": false,
							"itemsCreation": false,
							"floatingEditPanel": false
						}
					}
				}
			},
			{
				"operation": "insert",
				"name": "BackToConsoleButton",
				"values": {
					"type": "crt.Button",
					"caption": "Back to console",
					"color": "default",
					"disabled": false,
					"size": "large",
					"iconPosition": "only-icon",
					"visible": true,
					"clicked": {
						"request": "crt.OpenPageRequest",
						"params": {
							"schemaName": "iaSQLConsole_SectionPage"
						}
					},
					"clickMode": "default",
					"icon": "back-button-icon"
				},
				"parentName": "TitleContainer",
				"propertyName": "items",
				"index": 0
			}
		]/**SCHEMA_VIEW_CONFIG_DIFF*/,
		viewModelConfigDiff: /**SCHEMA_VIEW_MODEL_CONFIG_DIFF*/[
			{
				"operation": "merge",
				"path": [
					"attributes",
					"Items",
					"viewModelConfig",
					"attributes"
				],
				"values": {
					"PDS_CreatedBy": {
						"modelConfig": {
							"path": "PDS.CreatedBy"
						}
					},
					"PDS_CreatedOn": {
						"modelConfig": {
							"path": "PDS.CreatedOn"
						}
					},
					"PDS_iaRowNumber": {
						"modelConfig": {
							"path": "PDS.iaRowNumber"
						}
					},
					"PDS_iaPreview": {
						"modelConfig": {
							"path": "PDS.iaPreview"
						}
					}
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
					"entitySchemaName": "iaExportLog",
					"attributes": {
						"CreatedBy": {
							"path": "CreatedBy"
						},
						"CreatedOn": {
							"path": "CreatedOn"
						},
						"iaRowNumber": {
							"path": "iaRowNumber"
						},
						"iaPreview": {
							"path": "iaPreview"
						}
					}
				}
			}
		]/**SCHEMA_MODEL_CONFIG_DIFF*/,
		handlers: /**SCHEMA_HANDLERS*/[]/**SCHEMA_HANDLERS*/,
		converters: /**SCHEMA_CONVERTERS*/{}/**SCHEMA_CONVERTERS*/,
		validators: /**SCHEMA_VALIDATORS*/{}/**SCHEMA_VALIDATORS*/
	};
});
