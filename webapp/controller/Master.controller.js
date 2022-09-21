sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/ui/Device",
	"sap/m/PDFViewer"
], function(Controller, Fragment, MessageBox, Device, PDFViewer) {
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
				icon: MessageBox.Icon.INFORMATION,
				title: "Information",
				actions: ["Accept"],
				emphasizedAction: ["Accept"],
				Stretch: "False"
			});
		},                        //Dialog to open claimWizard fragment
		// onOpenUploadAttachment: function(oEvent) {
		// 	if (!this.AttachmentDialog) {
		// 		this.AttachmentDialog = sap.ui.xmlfragment("safetysuitezclaimemployee.fragment.AttchmentUpload", this);
		// 		this.getView().addDependent(this.AttachmentDialog);

		// 	}
		// 	this.WizardTitle = "Attachment";
		// 	this.AttachmentDialog.open();
		// },

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
		},                            // Next button for claimWizard fragment

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
		},                              // Previous buttom for claimWizard fragment

		handleWizardCancel: function(oEvent) {
			this.empDialog.close();
		},

		claimWizardSubmitBtn: function() {
			var sUrl = sap.ui.require.toUrl("safetysuitezclaimemployer/saplogo.pdf");
			var pdfViewer = new PDFViewer();
			pdfViewer.setSource(sUrl);
			pdfViewer.open();

			MessageBox.success("Your Form is sucessfully submitted!", {
				title: "Success",
				actions: ["Accept"],
				emphasizedAction: ["Accept"],
				Stretch: "False"
			});

			this.empDialog.close();
		},                          // Submit button in save manue for claimWizard fragment

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
		}                           // Save in Draft button in save manue for claimWizard fragment

	});

});