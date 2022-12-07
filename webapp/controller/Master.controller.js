jQuery.sap.require("safetysuitezclaimemployer.libs.canvas2image");
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/ui/Device",
	"safetysuitezclaimemployer/libs/signature_pad",
	"sap/m/UploadCollectionParameter"

], function(Controller, Fragment, MessageBox, Device, signaturePad, UploadCollectionParameter) {
	"use strict";
	var AttachmentModel = new sap.ui.model.json.JSONModel();

	return Controller.extend("safetysuitezclaimemployer.controller.Master", {

		onInit: function() {
			if (sap.ushell.Container) {
				this.userName = sap.ushell.Container.getService("UserInfo").getId();
			} else {
				this.userName = "JPRAKASH";
			}
			this.attachmentsId = [];

			var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/cnetohs/VWA_CLAIM_SRV/", true);
			var that = this;
			oModel.read("/IncidentsSet", {
				success: function(oData) {
					var JsonDataModel = new sap.ui.model.json.JSONModel();
					JsonDataModel.setData(oData.results);
					that.getView().byId("list").setModel(JsonDataModel, "JsonDataModel");
				}
			});
		},

		InputNumberDaysHoursLodgement: function(oEvent) {
			if (oEvent.getSource().getValue().length > 3) {
				oEvent.getSource().setValue(oEvent.getSource().getValue().slice(0, -1));
			}
		}, // For the maxlength of number in Date and hour field in employer lodgement.

		clickClaimBtn: function(oEvent) {
			var bindingPath = oEvent.getParameter("listItem").oBindingContexts.JsonDataModel.sPath;
			var SelectedRecord = oEvent.getSource().getModel("JsonDataModel").getObject(bindingPath);
			this.Casno = SelectedRecord.Casno;
			this.managerPerner = SelectedRecord.ManagerPernr;
			if (!this.empDialog) {
				this.empDialog = new sap.ui.xmlfragment("safetysuitezclaimemployer.fragment.claimWizard", this);
				this.getView().addDependent(this.empDialog);
				sap.ui.getCore().byId("html").setContent("<canvas id='signature-pad' width='200px' height='200px' class='signature-pad'></canvas>");
			}
			if (!this.oDefaultMessageDialog) {
				this.oDefaultMessageDialog = new sap.m.Dialog({
					type: sap.m.DialogType.Message,
					title: this.getView().getModel("i18n").getResourceBundle().getText("Information"),
					content: new sap.m.Text({
						text: this.getView().getModel("i18n").getResourceBundle().getText("InformationMessageDialogText")
					}),
					beginButton: new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: this.getView().getModel("i18n").getResourceBundle().getText("Accept"),
						press: function() {
							this.oDefaultMessageDialog.close();
							var that = this;
							this.getView().getModel().read("/getIncidentSet(Casno='" + this.Casno + "',ManagerPernr='" + this.managerPerner +
								"')", {
									success: function(oData, oResponse) {
										oData.MaxDate = new Date();
										oData.Signature = "data:image/bmp;base64," + oData.Signature;
										oData.Attachments = oData.Attachments.split(",");
										that.attachmentsId.push(oData.Attachments);
										that.empDialog.open();
										var canvas = document.getElementById("signature-pad");
										that.signaturePad = new SignaturePad(canvas, {
											backgroundColor: 'rgba(255, 255, 255, 1)',
											penColor: 'rgb(0, 0, 0)'
										});
										sap.ui.getCore().byId("signImg").setSrc(oData.Signature);
										sap.ui.getCore().byId("UploadCollection").setUploadUrl("/sap/opu/odata/cnetohs/VWA_CLAIM_SRV/Files");

										var IncidentSetData = new sap.ui.model.json.JSONModel(oData);
										that.getView().setModel(IncidentSetData, "IncidentSetData");
										var uname = new sap.ui.model.Filter("Userid", "EQ", that.userName);
										var casno = new sap.ui.model.Filter("Casno", "EQ", that.Casno);
										var Filter = [uname, casno];
										that.getView().getModel().read("/Files", {
											filters: Filter,
											success: function(fData) {
												if (fData.results.length > 0) {
													for (var j = 0; j < fData.results.length; j++) {
														fData.results[j].url = that.getView().getModel().sServiceUrl + "/Files(ArcDocId='" + fData.results[j].ArcDocId +
															"',Draftid='',Userid='" + that.userName + "')/$value";
														fData.results[j].ButtonVisibility = false;
														that.attachmentsId.push(fData.results[j].ArcDocId);
													}
												}
												AttachmentModel.setData(fData.results);
												sap.ui.getCore().byId("UploadCollection").setNumberOfAttachmentsText(that.getView().getModel("i18n").getResourceBundle()
													.getText("WizardAttachmentsListTitle") + "(" + fData.results.length + ")");
												sap.ui.getCore().byId("UploadCollection").setModel(AttachmentModel, "AttachmentModel");
											},
											error: function() {}
										});
									},
									error: function(error) {}
								});
						}.bind(this)
					})
				});
			}
			sap.ui.getCore().byId("claimWizardSubmitBtn").setEnabled(false);

			this.oDefaultMessageDialog.open();
			sap.ui.getCore().byId("claimFormWizard")._getProgressNavigator().ontap = function() {};
			sap.ui.getCore().byId("claimFormWizard")._scrollHandler = function() {
				if (this._scrollLocked) {
					return;
				}
				if (Device.browser === undefined) {
					var scrollTop = document.documentElement.querySelector(".sapMWizardStepContainer").scrollTop;
				} else {
					var scrollTop = event.target.scrollTop;
				}
				var progressNavigator = this._getProgressNavigator(),
					currentStepDOM = this._stepPath[progressNavigator.getCurrentStep() - 1].getDomRef();

				if (!currentStepDOM) {
					return;
				} else {
					var wizardStep = currentStepDOM.dataset.sapUi;
					if (wizardStep === "attachmentStep") {
						sap.ui.getCore().byId("claimWizardNextBtn").setVisible(false);
					} else if (wizardStep === "personalDetailStep") {
						sap.ui.getCore().byId("claimWizardPrevBtn").setVisible(false);
					} else {
						sap.ui.getCore().byId("claimWizardNextBtn").setVisible(true);
						sap.ui.getCore().byId("claimWizardPrevBtn").setVisible(true);
					}
				}
				var stepHeight = currentStepDOM.clientHeight,
					stepOffset = currentStepDOM.offsetTop,
					stepChangeThreshold = 100;

				if (scrollTop + stepChangeThreshold >= stepOffset + stepHeight && progressNavigator._isActiveStep(progressNavigator._currentStep +
						1)) {
					progressNavigator.nextStep();
				}
				var aSteps = this.getSteps();
				// change the navigator current step
				for (var index = 0; index < aSteps.length; index++) {
					if (scrollTop + stepChangeThreshold <= stepOffset) {
						progressNavigator.previousStep();

						// update the currentStep reference
						currentStepDOM = this._stepPath[progressNavigator.getCurrentStep() - 1].getDomRef();

						if (!currentStepDOM) {
							break;
						}
						stepOffset = currentStepDOM.offsetTop;
					}
				}
			};
		}, // To open the main wizard dialog.

		onDialogNextButton: function() {
			this._oWizard = sap.ui.getCore().byId("claimFormWizard");
			this._iSelectedStepIndex = this._oWizard.getCurrentStep();
			var oNextStep = this._oWizard.getSteps()[this._iSelectedStepIndex + 1];

			if (this._oSelectedStep && !this._oSelectedStep.bLast) {
				this._oWizard.goToStep(oNextStep, true);

			} else {
				this._oWizard.nextStep();
			}
			this._iSelectedStepIndex++;
			this._oSelectedStep = oNextStep;
			if (this._oWizard.getCurrentStep() === "attachmentStep") {
				sap.ui.getCore().byId("claimWizardNextBtn").setVisible(false);
				sap.ui.getCore().byId("claimWizardSubmitBtn").setEnabled(true);
			} else if (this._oWizard.getCurrentStep() === "personalDetailStep") {
				sap.ui.getCore().byId("claimWizardPrevBtn").setVisible(false);
			} else {
				sap.ui.getCore().byId("claimWizardNextBtn").setVisible(true);
				sap.ui.getCore().byId("claimWizardPrevBtn").setVisible(true);
			}
		}, // Code for next button in the main claim wizard control.

		onDialogBackButton: function() {
			this._iSelectedStepIndex = this._oWizard.getCurrentStep();
			var oPreviousStep = this._oWizard.getSteps()[this._iSelectedStepIndex - 1];

			if (this._oSelectedStep) {
				this._oWizard.goToStep(oPreviousStep, true);
			} else {
				this._oWizard.previousStep();
			}
			if (this._oWizard.getCurrentStep() === "attachmentStep") {
				sap.ui.getCore().byId("claimWizardNextBtn").setVisible(false);
			} else if (this._oWizard.getCurrentStep() === "personalDetailStep") {
				sap.ui.getCore().byId("claimWizardPrevBtn").setVisible(false);
			} else {
				sap.ui.getCore().byId("claimWizardNextBtn").setVisible(true);
				sap.ui.getCore().byId("claimWizardPrevBtn").setVisible(true);
			}
			this._iSelectedStepIndex--;
			this._oSelectedStep = oPreviousStep;
		}, // Code for the previous button in main claim wizard control.

		handleWizardCancel: function(oEvent) {

			// this.getView().byId("inputElDateClmfrm").setValue("");
			this.empDialog.close();
			this._oWizard.setCurrentStep(this.initalWizardStep);
			sap.ui.getCore().byId("claimWizardPrevBtn").setVisible(false);
			sap.ui.getCore().byId("claimWizardNextBtn").setVisible(true);
			this.onClearLodgementForm();

		}, // To cancel the wizard.

		onChange: function(oEvent) {
			var oUploadCollection = oEvent.getSource();
			var oCustomerRequestToken = new sap.m.UploadCollectionParameter({
				name: "x-requested-with",
				value: "X"
			});
			oUploadCollection.addHeaderParameter(oCustomerRequestToken);

			var oCustomerAcceptToken = new sap.m.UploadCollectionParameter({
				name: "Accept",
				value: "application/json;odata=verbose"
			});
			oUploadCollection.addHeaderParameter(oCustomerAcceptToken);
		}, // Mandotory event to set the header parameter for upload collection.

		onUploadComplete: function(oEvent) {
			this.getView().getModel().refresh();
			var fileId = oEvent.mParameters.mParameters.headers.location;
			var docid = fileId.split("(")[1].replace(")", "");
			var oUploadCollection = sap.ui.getCore().byId("UploadCollection");
			if (oUploadCollection.getModel("AttachmentModel").getData().length === undefined) {
				var oData = [];
				this.attachmentsId[0] = [];
			} else {
				var oData = oUploadCollection.getModel("AttachmentModel").getData();
			}

			var url = this.getView().getModel().sServiceUrl + "/Files(" + docid + ")/$value";
			docid = docid.split("='")[1].replace("',Draftid", "");
			var that = this;
			oData.unshift({
				"ArcDocId": docid,
				"Filename": oEvent.getParameter("files")[0].fileName,
				"url": url,
				"ButtonVisibility": true
			});
			if (oUploadCollection.getModel("AttachmentModel").getData().length === undefined) {
				oUploadCollection.getModel("AttachmentModel").setData(oData);
			}
			this.attachmentsId[0].push(docid);
			//sap.ui.getCore().byId("uploadCollectionTable").setUrl(oEvent.mParameters.mParameters.headers.location);
			// Sets the text to the label
			oUploadCollection.getModel("AttachmentModel").refresh();
			var aItems = oUploadCollection.getItems();
			sap.ui.getCore().byId("UploadCollection").setNumberOfAttachmentsText("Employee Attachments(" + aItems.length + ")");
		}, // For file upload process.

		onBeforeUploadStarts: function(oEvent) {
			var oModel = this.getView().getModel();
			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: encodeURIComponent(oEvent.getParameter("fileName"))
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
			oModel.refreshSecurityToken();
			var oHeaders = oModel.oHeaders;
			var sToken = oHeaders['x-csrf-token'];
			var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
				name: "x-csrf-token",
				value: sToken
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderToken);
		}, // For uploading the files.

		deleteAttachmentListItems: function(oEvent) {
			var sItemToDeleteId = oEvent.getParameter("documentId");
			var oData = sap.ui.getCore().byId("UploadCollection").getModel("AttachmentModel").getData();
			if (oData.length > 0) {
				for (var i = 0; i < oData.length; i++) {
					if (oData[i].ArcDocId === sItemToDeleteId) {
						oData.splice(i, 1);
						sap.ui.getCore().byId("UploadCollection").getModel("AttachmentModel").refresh();
						break;
					}
				}
			}
			if (this.attachmentsId[0].length > 0) {
				for (var j = 0; j < this.attachmentsId[0].length; j++) {
					if (this.attachmentsId[0][j] === sItemToDeleteId) {
						this.attachmentsId[0].splice(j, 1);
						break;
					}
				}
			}
			sap.ui.getCore().byId("UploadCollection").getModel("AttachmentModel").setData(oData);
			var Items = sap.ui.getCore().byId("UploadCollection").getItems();
			sap.ui.getCore().byId("UploadCollection").setNumberOfAttachmentsText(this.getView().getModel("i18n").getResourceBundle().getText(
				"WizardAttachmentsListTitle") + "(" + Items.length + ")");
		}, // To delete the files from the attchment list.

		clearButton: function(oEvent) {
			this.signaturePad.clear();
		}, // To clear the signature.

		claimWizardSubmitBtn: function(oEvent) {
			this._oWizard = sap.ui.getCore().byId("claimFormWizard");
			// var txtReturToWorkClaimFormSubmissionDate = sap.ui.getCore().byId("txtReturToWorkClaimFormSubmissionDate");
			var inputEmSigdate = sap.ui.getCore().byId("inputEmSigdate");
			var inputEmpClmfrmDate = sap.ui.getCore().byId("inputEmpClmfrmDate");
			if (!this.oApproveDialog) {
				this.oApproveDialog = new sap.m.Dialog({
					type: sap.m.DialogType.Message,
					title: this.getView().getModel("i18n").getResourceBundle().getText("Confirm"),
					content: new sap.m.Text({
						text: this.getView().getModel("i18n").getResourceBundle().getText("comfirmationMessage")
					}),
					beginButton: new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: "Submit",
						press: function(oEvent) {
							var inputEmpMcertDate = sap.ui.getCore().byId("inputEmpMcertDate");
							var inputNamePosition = sap.ui.getCore().byId("inputNamePosition");
							var inputElEstCostClm = sap.ui.getCore().byId("inputElEstCostClm");
							var inputDay1 = sap.ui.getCore().byId("inputDay1");
							var inputShour = sap.ui.getCore().byId("inputShour");
							var inputElDate = sap.ui.getCore().byId("inputElDate");
							var inputName1 = sap.ui.getCore().byId("inputName1");
							var inputElSchRegNo = sap.ui.getCore().byId("inputElSchRegNo");
							var canvas = document.getElementById("signature-pad");
							var oBMP = Canvas2Image.convertToBMP(canvas);
							var str = oBMP.src;
							this.signString = str.replace("data:image/bmp;base64,", "");
							if (inputEmpClmfrmDate.getValue() !== "") {
								var EmpClmfrmDate = new Date(inputEmpClmfrmDate.getValue()).toLocaleDateString("fr-BE", {
									year: "numeric",
									month: "2-digit",
									day: "2-digit"
								});
							}
							if (inputEmpMcertDate.getValue() !== "") {
								var EmpMcertDate = new Date(inputEmpMcertDate.getValue()).toLocaleDateString("fr-BE", {
									year: "numeric",
									month: "2-digit",
									day: "2-digit"
								});
							}
							if (inputEmSigdate.getValue() !== "") {
								var EmSigdate = new Date(inputEmSigdate.getValue()).toLocaleDateString("fr-BE", {
									year: "numeric",
									month: "2-digit",
									day: "2-digit"
								});
							}
							if (inputElDate.getValue() !== "") {
								var ElDate = new Date(inputElDate.getValue()).toLocaleDateString("fr-BE", {
									year: "numeric",
									month: "2-digit",
									day: "2-digit"
								});
							}
							if (inputElEstCostClm.getValue() !== "") {
								var ElEstCostClm = inputElEstCostClm.getValue();
							}
							var payload = {
								"Pernr": this.managerPerner,
								"Casno": this.Casno,
								"Filename": "",
								"Employeeposition": inputNamePosition.getValue(),
								"EmpClmfrmDate": !EmpClmfrmDate ? "" : EmpClmfrmDate,
								"EmSigdate": !EmSigdate ? "" : EmSigdate,
								"EmpMcertDate": !EmpMcertDate ? "" : EmpMcertDate,
								"ElEstCostClm": !ElEstCostClm ? "" : ElEstCostClm,
								"Name1": inputName1.getValue(),
								"Day1": inputDay1.getValue(),
								"Shour": inputShour.getValue(),
								"ElDate": !ElDate ? "" : ElDate,
								"ElSchRegNo": inputElSchRegNo.getValue(),
								"EmplSig": this.signString,
								"Attachments": this.attachmentsId.toString()
							};
							this.oApproveDialog.close();
							var that = this;
							this.getView().getModel().create("/EmployerLodgementSet", payload, {
								success: function(oData, oResponse) {
									var sSource = that.getView().getModel().sServiceUrl + "/InjuryFormSet(Casno='" + that.Casno + "',Userid='" + that.userName +
										"')/$value";
									sap.m.MessageBox.success(
										that.Casno + " " + that.getView().getModel("i18n").getResourceBundle().getText("ClaimSuccessMessage"), {
											actions: [that.getView().getModel("i18n").getResourceBundle().getText("ok")],
											onClose: function(sAction) {
												that.empDialog.close();
												that.onClearLodgementForm();
												sap.ui.getCore().byId("claimWizardNextBtn").setVisible(true);
												sap.ui.getCore().byId("claimWizardSubmitBtn").setEnabled(false);
												that._oWizard.setCurrentStep("personalDetailStep");
												that._pdfViewer = new sap.m.PDFViewer();
												that.getView().addDependent(that._pdfViewer);
												that._pdfViewer.setSource(sSource);
												that._pdfViewer.setTitle(that.getView().getModel("i18n").getResourceBundle().getText("SamrtFormTitle"));
												that._pdfViewer.open();

												that.getView().getModel().read("/IncidentsSet", {
													success: function(oData) {
														var JsonDataModel = new sap.ui.model.json.JSONModel();
														JsonDataModel.setData(oData.results);
														that.getView().byId("list").setModel(JsonDataModel, "JsonDataModel");
													}
												});
											}
										}
									);
								},
								error: function(error) {}
							});
						}.bind(this)
					}),
					endButton: new sap.m.Button({
						text: "Cancel",
						press: function() {
							this.oApproveDialog.close();
						}.bind(this)
					})
				});
			}
			this.oApproveDialog.open();

		}, // submit the form 

		onClearLodgementForm: function() {
			sap.ui.getCore().byId("inputEmpClmfrmDate").setValue("");
			sap.ui.getCore().byId("inputEmpMcertDate").setValue("");
			sap.ui.getCore().byId("inputNamePosition").setValue("");
			sap.ui.getCore().byId("inputElEstCostClm").setValue("");
			sap.ui.getCore().byId("inputDay1").setValue("");
			sap.ui.getCore().byId("inputShour").setValue("");
			sap.ui.getCore().byId("inputElDate").setValue("");
			sap.ui.getCore().byId("inputName1").setValue("");
			sap.ui.getCore().byId("inputElSchRegNo").setValue("");
			sap.ui.getCore().byId("inputEmSigdate").setValue("");

		}, // to clear the form

		onSearch: function(oEvent) {
				var oFilter = [];
				var searchValue = oEvent.getSource().getValue();
				var filters = [new sap.ui.model.Filter("Casno", sap.ui.model.FilterOperator.Contains, searchValue),
					new sap.ui.model.Filter("FamilyName", sap.ui.model.FilterOperator.Contains, searchValue),
					new sap.ui.model.Filter("Conname", sap.ui.model.FilterOperator.Contains, searchValue)
				];
				oFilter = new sap.ui.model.Filter(filters, false);
				this.getView().byId("list").getBinding("items").filter(oFilter);
			} //search field

	});
});