sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/ui/Device",
	"sap/m/UploadCollectionParameter"

], function(Controller, Fragment, MessageBox, Device, PDFViewer, UploadCollectionParameter, Dialog) {
	"use strict";

	return Controller.extend("safetysuitezclaimemployer.controller.Master", {

		onInit: function() {
			var oModel = this.getOwnerComponent().getModel("employerList");
			this.getView().setModel(oModel);

			// var alternativeLanguage = sap.ui.getCore().getConfiguration().getLanguage();
			// var i18nPath = "i18n/i18n";
			// if (alternativeLanguage === "de_DE") {
			// 	i18nPath = i18nPath + "_de.properties";
			// } else if (alternativeLanguage === "ja") {
			// 	i18nPath = i18nPath + "_ja.properties";
			// } else {
			// 	i18nPath = i18nPath + ".properties";
			// }
			// var oi18nModel = new sap.ui.model.resource.ResourceModel({
			// 	bundleUrl: i18nPath
			// });
			// sap.ui.getCore().setModel(oi18nModel, "i18n");
		},

		clickClaimBtn: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("listItem").setSelected(false);
			if (!this.empDialog) {
				this.empDialog = new sap.ui.xmlfragment("safetysuitezclaimemployer.fragment.claimWizard", this);
				this.getView().addDependent(this.empDialog);
				this.empDialog.open();
			} else if (this.empDialog === oSelectedItem) {
				this.empDialog.open();
			} else {
				this.empDialog.open();
			}

			if (!this.oDefaultMessageDialog) {
				this.oDefaultMessageDialog = new sap.m.Dialog({
					type: sap.m.DialogType.Message,
					title: "Information",
					content: new sap.m.Text({
						text: "Please Review the claim information lodged by the employee"
					}),
					beginButton: new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: "Accept",
						press: function() {
							this.oDefaultMessageDialog.close();
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
		}, // To open the main wizard dialog

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
		}, // Code for previous button in the main claim wizard control.

		handleWizardCancel: function() {
			this.empDialog.close();
			this._oWizard.setCurrentStep(this.initalWizardStep);
			sap.ui.getCore().byId("claimWizardPrevBtn").setVisible(false);
			sap.ui.getCore().byId("claimWizardNextBtn").setVisible(true);

		},

		onChange: function(oEvent) {
			var oUploadCollection = oEvent.getSource();
			// Header Token
			var oCustomerHeaderToken = new UploadCollectionParameter({
				name: "x-csrf-token",
				value: "securityTokenFromModel"
			});
			oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
		}, // Mandotory event to set the header parameter for upload collection.

		onUploadComplete: function(oEvent) {
			var oUploadCollection = sap.ui.getCore().byId("UploadCollection");
			var oData = oUploadCollection.getModel().getData();
			var url = sap.ui.require.toUrl("safetysuitezclaimemployer/Attachment_Sample_Files/IdentityProof.png");
			oData.items.unshift({
				"documentId": jQuery.now().toString(), // generate Id,
				"fileName": oEvent.getParameter("files")[0].fileName,
				"mimeType": "",
				"thumbnailUrl": "",
				"url": url,
				"attributes": [{
					"title": "Uploaded By",
					"text": "You",
					"active": false
				}, {
					"title": "Uploaded On",
					"text": new Date(jQuery.now()).toLocaleDateString(),
					"active": false
				}, {
					"title": "File Size",
					"text": "505000",
					"active": false
				}]
			});
			this.getView().getModel().refresh();
			// Sets the text to the label
			var aItems = sap.ui.getCore().byId("UploadCollection").getItems();
			sap.ui.getCore().byId("UploadCollection").setNumberOfAttachmentsText("Employee Attachments(" + aItems.length + ")");
			// delay the success message for to notice onChange message
			setTimeout(function() {
				sap.m.MessageToast.show("UploadComplete event triggered.");
			}, 4000);
		}, // For file upload process.

		onBeforeUploadStarts: function(oEvent) {
			// Header Slug
			var oCustomerHeaderSlug = new UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
			//sap.m.MessageToast.show("BeforeUploadStarts event triggered.");
		}, //Madotory event for before file upload.

		deleteAttachmentListItems: function(oEvent) {
			var sItemToDeleteId = oEvent.getParameter("documentId");
			var oData = sap.ui.getCore().byId("UploadCollection").getModel().getData();
			var aItems = jQuery.extend(true, {}, oData).items;
			jQuery.each(aItems, function(index) {
				if (aItems[index] && aItems[index].documentId === sItemToDeleteId) {
					aItems.splice(index, 1);
				}
			});
			sap.ui.getCore().byId("UploadCollection").getModel().setData({
				"items": aItems
			});
			var Items = sap.ui.getCore().byId("UploadCollection").getItems();
			sap.ui.getCore().byId("UploadCollection").setNumberOfAttachmentsText("Employee Attachments(" + Items.length + ")");
		}, // To delete the files from the attchment list.

		claimWizardSubmitBtn: function() {
			if (!this.oApproveDialog) {
				this.oApproveDialog = new sap.m.Dialog({
					type: sap.m.DialogType.Message,
					title: "Confirm",
					content: new sap.m.Text({
						text: "Do you want to submit this claim?"
					}),
					beginButton: new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: "Submit",
						press: function() {
							var sSource = sap.ui.require.toUrl("safetysuitezclaimemployer/Attachment_Sample_Files/2056106_E_20220914.pdf");
							this.oApproveDialog.close();
							this.empDialog.close();
							this.initalWizardStep = this._oWizard._getStartingStep();
							this._oWizard.setCurrentStep(this.initalWizardStep);
							sap.ui.getCore().byId("claimWizardPrevBtn").setVisible(false);
							sap.ui.getCore().byId("claimWizardNextBtn").setVisible(true);
							this._pdfViewer = new sap.m.PDFViewer();
							this.getView().addDependent(this._pdfViewer);
							this._pdfViewer.setSource(sSource);
							this._pdfViewer.setTitle("Details of Claim Form");
							this._pdfViewer.open();
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
		}

	});
});