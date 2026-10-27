define("iaSQLLog_ListPage", /**SCHEMA_DEPS*/[]/**SCHEMA_DEPS*/, function/**SCHEMA_ARGS*/()/**SCHEMA_ARGS*/ {
	return {
		viewConfigDiff: /**SCHEMA_VIEW_CONFIG_DIFF*/[
			{
				"operation": "merge",
				"name": "LookupQuickFilterByTag",
				"values": {
					"config": {
						"caption": "#ResourceString(LookupQuickFilterByTag_config_caption)#",
						"hint": "#ResourceString(LookupQuickFilterByTag_config_hint)#",
						"icon": "tag-icon",
						"iconPosition": "left-icon",
						"entitySchemaName": null,
						"defaultValue": []
					},
					"_filterOptions": {
						"expose": [
							{
								"attribute": "LookupQuickFilterByTag_Items",
								"converters": [
									{
										"converter": "crt.QuickFilterAttributeConverter",
										"args": [
											{
												"target": {
													"viewAttributeName": "Items"
												},
												"quickFilterType": "lookup"
											}
										]
									}
								]
							}
						],
						"from": "LookupQuickFilterByTag_Value"
					}
				}
			},
			{
				"operation": "merge",
				"name": "DataTable",
				"values": {
					"columns": [
						{
							"id": "681bfd50-e4bb-8370-a546-90415852f6ed",
							"code": "PDS_iaPreview",
							"caption": "Query",
							"dataValueType": 28
						},
						{
							"id": "8a516ea2-c37f-4c4e-9fb1-5e6c7d8f9a01",
							"code": "PDS_CreatedBy",
							"caption": "Created by",
							"dataValueType": 10
						},
						{
							"id": "9b627fb3-d480-4d5f-8ac2-6f7d8e9fab12",
							"code": "PDS_iaStart",
							"caption": "Start",
							"dataValueType": 7,
							"width": 137
						},
						{
							"id": "ac7380c4-e591-4e60-9bd3-708e9fa0bc23",
							"code": "PDS_iaEnd",
							"caption": "End",
							"dataValueType": 7,
							"width": 137
						}
					],
					"placeholder": false,
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
					"attributes"
				],
				"values": {
					"Items_PredefinedFilter": {
						"value": null
					}
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
					"PDS_iaPreview": {
						"modelConfig": {
							"path": "PDS.iaPreview"
						}
					},
					"PDS_CreatedBy": {
						"modelConfig": {
							"path": "PDS.CreatedBy"
						}
					},
					"PDS_iaStart": {
						"modelConfig": {
							"path": "PDS.iaStart"
						}
					},
					"PDS_iaEnd": {
						"modelConfig": {
							"path": "PDS.iaEnd"
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
					"filterAttributes": [
						{
							"name": "LookupQuickFilterByTag_Items",
							"loadOnChange": true
						},
						{
							"name": "SearchFilter_Items",
							"loadOnChange": true
						},
						{
							"loadOnChange": true,
							"name": "Items_PredefinedFilter"
						}
					]
				}
			}
		]/**SCHEMA_VIEW_MODEL_CONFIG_DIFF*/,
		modelConfigDiff: /**SCHEMA_MODEL_CONFIG_DIFF*/[
			{
				"operation": "remove",
				"path": [],
				"properties": [
					"dependencies"
				]
			},
			{
				"operation": "merge",
				"path": [
					"dataSources",
					"PDS",
					"config"
				],
				"values": {
					"entitySchemaName": "iaSQLConsole",
					"attributes": {
						"iaPreview": {
							"path": "iaPreview"
						},
						"CreatedBy": {
							"path": "CreatedBy"
						},
						"iaStart": {
							"path": "iaStart"
						},
						"iaEnd": {
							"path": "iaEnd"
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