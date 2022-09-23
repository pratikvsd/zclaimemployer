sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/ui/Device",
	"sap/m/UploadCollectionParameter"
], function(Controller, Fragment, MessageBox, Device, PDFViewer, UploadCollectionParameter) {
	"use strict";

	return Controller.extend("safetysuitezclaimemployer.controller.Master", {

		onInit: function() {
			this.WizardTitle = "";
			var oModel = this.getOwnerComponent().getModel("employerList");
			this.getView().setModel(oModel);
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

			MessageBox.show("Please Review the claim information lodged by the employee", {
				type: sap.m.ButtonType.Emphasized,
				icon: MessageBox.Icon.INFORMATION,
				title: "Information",
				actions: ["Accept"],
				emphasizedAction: ["Accept"],
				Stretch: "False"
			});
		},
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
			} else if (this._oWizard.getCurrentStep() === "personalDetailStep") {
				sap.ui.getCore().byId("claimWizardPrevBtn").setVisible(false);
			} else {
				sap.ui.getCore().byId("claimWizardNextBtn").setVisible(true);
				sap.ui.getCore().byId("claimWizardPrevBtn").setVisible(true);
			}
		}, // Next button for claimWizard fragment

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
		}, // Previous buttom for claimWizard fragment

		handleWizardCancel: function(oEvent) {
			this.empDialog.close();
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
		},

		claimWizardSaveDraftBtn: function() {
				MessageBox.success("Your form is saved in draft", {
					title: "Success",
					onClose: null,
					styleClass: "",
					actions: sap.m.MessageBox.Action.OK,
					emphasizedAction: sap.m.MessageBox.Action.OK,
					initialFocus: null,
					textDirection: sap.ui.core.TextDirection.Inherit
				});
				this.empDialog.close();
			} // Save in Draft button in save manue for claimWizard fragment
	});
});