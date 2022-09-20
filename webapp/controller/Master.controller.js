sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/ui/Device"
], function(Controller, Fragment, MessageBox, Device) {
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
			sap.m.MessageBox.show("Please Review the claim information lodged by the employee", {
				icon: sap.m.MessageBox.Icon.NONE,
				title: "",
				actions: ["Accept"],
				emphasizedAction: "Accept",
				// actions: sap.m.MessageBox.Action.Accept,
				// emphasizedAction: sap.m.MessageBox.Action.Accept,
				textDirection: sap.ui.core.TextDirection.Inherit
			});
		},

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
		},

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
		},

		handleWizardCancel: function(oEvent) {
			this.empDialog.close();
		}

	});

});