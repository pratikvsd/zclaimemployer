sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/ui/Device",
	"sap/m/UploadCollectionParameter"

], function(Controller, Fragment, MessageBox, Device, UploadCollectionParameter, Dialog) {
	"use strict";
	var AttachmentModel = new sap.ui.model.json.JSONModel();
	this.roughString =
		"46174613A696D6167652F6A7065673B6261736536342C2F396A2F34414151536B5A4A5267414241514141415141424141442F3467496F53554E445831425354305A4A544555414151454141414959414141414141517741414274626E5279556B64434946685A576941414141414141414141414141414141426859334E77414141414141414141414141414141414141414141414141414141414141414141414141415141413974594141514141414144544C5141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141416C6B5A584E6A";

	return Controller.extend("safetysuitezclaimemployer.controller.Master", {

		onInit: function() {
			// this.userName = sap.ushell.Container.getService("UserInfo").getId();
			this.userName = 'JPRAKASH';
			this.attachmentsId = [];
		},

		InputNumberDaysHoursLodgement: function(oEvent) {
			if (oEvent.getSource().getValue().length > 3) {
				oEvent.getSource().setValue(oEvent.getSource().getValue().slice(0, -1));
			}
		}, // For the maxlength of number in Date and hour field in employer lodgement.

		clickClaimBtn: function(oEvent) {
			var SelectedRecord = oEvent.getParameter("listItem").getBindingContext().getObject();
			this.managerPerner = SelectedRecord.ManagerPernr;
			this.Casno = SelectedRecord.Casno;
			if (!this.empDialog) {
				this.empDialog = new sap.ui.xmlfragment("safetysuitezclaimemployer.fragment.claimWizard", this);
				this.getView().addDependent(this.empDialog);
				sap.ui.getCore().byId("html").setContent("<canvas id='signature-pad' width='200px' height='200px' class='signature-pad'></canvas>");
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
							var that = this;
							this.getView().getModel().read("/getIncidentSet(Casno='" + SelectedRecord.Casno + "',ManagerPernr='" + this.managerPerner +
								"')", {
									success: function(oData, oResponse) {

										oData.Signature = atob(oData.Signature);
										that.empDialog.open();
										sap.ui.getCore().byId("UploadCollection").setUploadUrl("/sap/opu/odata/cnetohs/VWA_CLAIM_SRV/Files");
										that.onSign();
										var IncidentSetData = new sap.ui.model.json.JSONModel(oData);
										that.getView().setModel(IncidentSetData, "IncidentSetData");
										var uname = new sap.ui.model.Filter("Userid", "EQ", that.userName);
										var casno = new sap.ui.model.Filter("Casno", "EQ", SelectedRecord.Casno);
										var Filter = [uname, casno];
										that.getView().getModel().read("/Files", {
											filters: Filter,
											success: function(fData) {
												for (var j = 0; j < fData.results.length; j++) {
													fData.results[j].url = that.getView().getModel().sServiceUrl + "/Files(ArcDocId='" + fData.results[j].ArcDocId +
														"',Draftid='',Userid='" + that.userName + "')/$value";
													fData.results[j].ButtonVisibility = false;
													that.attachmentsId.push(fData.results[j].ArcDocId);
												}
												AttachmentModel.setData(fData.results);
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
			debugger;
			// this.getView().byId("inputElDateClmfrm").setValue("");
			this.empDialog.close();
			this._oWizard.setCurrentStep(this.initalWizardStep);
			sap.ui.getCore().byId("claimWizardPrevBtn").setVisible(false);
			sap.ui.getCore().byId("claimWizardNextBtn").setVisible(true);
			this.onClearLodgementForm();

		}, // To cancel the wizard.

		onChange: function(oEvent) {
			var oUploadCollection = oEvent.getSource();
			var oCustomerRequestToken = new UploadCollectionParameter({
				name: "x-requested-with",
				value: "X"
			});
			oUploadCollection.addHeaderParameter(oCustomerRequestToken);

			var oCustomerAcceptToken = new UploadCollectionParameter({
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
			this.attachmentsId.push(docid);
			//sap.ui.getCore().byId("uploadCollectionTable").setUrl(oEvent.mParameters.mParameters.headers.location);
			// Sets the text to the label
			oUploadCollection.getModel("AttachmentModel").refresh();
			var aItems = oUploadCollection.getItems();
			sap.ui.getCore().byId("UploadCollection").setNumberOfAttachmentsText("Employee Attachments(" + aItems.length + ")");
		}, // For file upload process.

		onBeforeUploadStarts: function(oEvent) {
			var oModel = this.getView().getModel();
			var oCustomerHeaderSlug = new UploadCollectionParameter({
				name: "slug",
				value: encodeURIComponent(oEvent.getParameter("fileName"))
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
			oModel.refreshSecurityToken();
			var oHeaders = oModel.oHeaders;
			var sToken = oHeaders['x-csrf-token'];
			var oCustomerHeaderToken = new UploadCollectionParameter({
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
			if (this.attachmentsId.length > 0) {
				for (var j = 0; j < this.attachmentsId.length; j++) {
					if (this.attachmentsId[j] === sItemToDeleteId) {
						this.attachmentsId.splice(j, 1);
						break;
					}
				}
			}
			sap.ui.getCore().byId("UploadCollection").getModel("AttachmentModel").setData(oData);
			var Items = sap.ui.getCore().byId("UploadCollection").getItems();
			sap.ui.getCore().byId("UploadCollection").setNumberOfAttachmentsText("Employee Attachments(" + Items.length + ")");
		}, // To delete the files from the attchment list.

		onSign: function() {
			var canvas = document.getElementById("signature-pad");
			var context = canvas.getContext("2d");
			canvas.width = 200;
			canvas.height = 200;
			context.fillStyle = "#fff";
			context.strokeStyle = "#444";
			context.lineWidth = 1.5;
			context.lineCap = "round";
			context.fillRect(0, 0, canvas.width, canvas.height);
			var disableSave = true;
			var pixels = [];
			var cpixels = [];
			var xyLast = {};
			var xyAddLast = {};
			var calculate = false; { //functions
				function remove_event_listeners() {
					canvas.removeEventListener('mousemove', on_mousemove, false);
					canvas.removeEventListener('mouseup', on_mouseup, false);
					canvas.removeEventListener('touchmove', on_mousemove, false);
					canvas.removeEventListener('touchend', on_mouseup, false);

					document.body.removeEventListener('mouseup', on_mouseup, false);
					document.body.removeEventListener('touchend', on_mouseup, false);
				}

				function get_coords(e) {
					var x, y;

					if (e.changedTouches && e.changedTouches[0]) {
						var canvasArea = canvas.getBoundingClientRect();
						var offsety = canvasArea.top || 0;
						var offsetx = canvasArea.left || 0;

						x = e.changedTouches[0].pageX - offsetx;
						y = e.changedTouches[0].pageY - offsety;
					} else if (e.layerX || 0 == e.layerX) {
						x = e.layerX;
						y = e.layerY;
					} else if (e.offsetX || 0 == e.offsetX) {
						x = e.offsetX;
						y = e.offsetY;
					}

					return {
						x: x,
						y: y
					};
				}

				function on_mousedown(e) {
					e.preventDefault();
					e.stopPropagation();

					canvas.addEventListener('mouseup', on_mouseup, false);
					canvas.addEventListener('mousemove', on_mousemove, false);
					canvas.addEventListener('touchend', on_mouseup, false);
					canvas.addEventListener('touchmove', on_mousemove, false);
					document.body.addEventListener('mouseup', on_mouseup, false);
					document.body.addEventListener('touchend', on_mouseup, false);

					var empty = false;
					var xy = get_coords(e);
					context.beginPath();
					pixels.push('moveStart');
					context.moveTo(xy.x, xy.y);
					pixels.push(xy.x, xy.y);
					xyLast = xy;
				}

				function on_mousemove(e, finish) {
					e.preventDefault();
					e.stopPropagation();

					var xy = get_coords(e);
					var xyAdd = {
						x: (xyLast.x + xy.x) / 2,
						y: (xyLast.y + xy.y) / 2
					};

					if (calculate) {
						var xLast = (xyAddLast.x + xyLast.x + xyAdd.x) / 3;
						var yLast = (xyAddLast.y + xyLast.y + xyAdd.y) / 3;
						pixels.push(xLast, yLast);
					} else {
						calculate = true;
					}

					context.quadraticCurveTo(xyLast.x, xyLast.y, xyAdd.x, xyAdd.y);
					pixels.push(xyAdd.x, xyAdd.y);
					context.stroke();
					context.beginPath();
					context.moveTo(xyAdd.x, xyAdd.y);
					xyAddLast = xyAdd;
					xyLast = xy;

				}

				function on_mouseup(e) {
					remove_event_listeners();
					disableSave = false;
					context.stroke();
					pixels.push('e');
					calculate = false;
				};
				canvas.addEventListener('touchstart', on_mousedown, false);
				canvas.addEventListener('mousedown', on_mousedown, false);
			}

		}, // The signature canvas.

		clearButton: function(oEvent) {
			var canvas = document.getElementById("signature-pad");
			var context = canvas.getContext("2d");
			context.clearRect(0, 0, canvas.width, canvas.height);
		}, // To clear the signature.

		claimWizardSubmitBtn: function(oEvent) {
			this._oWizard = sap.ui.getCore().byId("claimFormWizard");
			var txtReturToWorkClaimFormSubmissionDate = sap.ui.getCore().byId("txtReturToWorkClaimFormSubmissionDate");
			var txtDeclarationDate = sap.ui.getCore().byId("txtDeclarationDate");
			var inputEmpMcertDate = sap.ui.getCore().byId("inputEmpMcertDate");
			var inputNamePosition = sap.ui.getCore().byId("inputNamePosition");
			var inputElEstCostClm = sap.ui.getCore().byId("inputElEstCostClm");
			var inputDay1 = sap.ui.getCore().byId("inputDay1");
			var inputShour = sap.ui.getCore().byId("inputShour");
			var inputELDATE = sap.ui.getCore().byId("inputELDATE");
			var inputName1 = sap.ui.getCore().byId("inputName1");
			var inputElSchRegNo = sap.ui.getCore().byId("inputElSchRegNo");
			if (inputEmpMcertDate.getValue() !== "" || inputEmpMcertDate.getDateValue() !== null) {
				var EmpMcertDate = new Date(inputEmpMcertDate.getDateValue()).toISOString();
			}
			if (txtReturToWorkClaimFormSubmissionDate.getText() !== "") {
				var EmpClmfrmDate = new Date(txtReturToWorkClaimFormSubmissionDate.getText()).toISOString();
			}
			if (txtDeclarationDate.getText() !== "") {
				var DDate = new Date(txtDeclarationDate.getText()).toISOString();
			}
			if (inputELDATE.getValue() !== "" || inputELDATE.getDateValue() !== null) {
				var ElDate = new Date(inputELDATE.getDateValue()).toISOString();
			}
			if (inputElEstCostClm.getValue() !== "" || inputElEstCostClm.getValue() !== null) {
				var ElEstCostClm = inputElEstCostClm.getValue();
			}
			var canvas = document.getElementById("signature-pad");
			this.signString = btoa(encodeURI(canvas.toDataURL('image/jpeg').replace("data:image/jpeg:base64,", "")));
			if (this.roughString === this.signString) {
				this.signString = "";
			}
			if (oEvent.getSource().getId() === "claimWizardSubmitBtn") {
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
							press: function(oEvent) {
								var payload = {
									"Pernr": this.managerPerner,
									"Casno": this.Casno,
									"Filename": "",
									"Employeeposition": inputNamePosition.getValue(),
									"EmpClmfrmDate": !EmpClmfrmDate ? "" : EmpClmfrmDate,
									"DDate": !DDate ? "" : DDate,
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
											that.Casno + " Claim submitted successfully", {
												actions: [sap.m.MessageBox.Action.OK],
												onClose: function(sAction) {
													that.empDialog.close();
													that.onClearLodgementForm();
													sap.ui.getCore().byId("claimWizardNextBtn").setVisible(true);
													sap.ui.getCore().byId("claimWizardSubmitBtn").setEnabled(false);
													that._oWizard.setCurrentStep("personalDetailStep");
													that._pdfViewer = new sap.m.PDFViewer();
													that.getView().addDependent(that._pdfViewer);
													that._pdfViewer.setSource(sSource);
													that._pdfViewer.setTitle("Claim Form");
													that._pdfViewer.open();
													that.getView().byId("list").getModel().refresh();
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
			}
		}, // submit the form 

		onClearLodgementForm: function() {
			sap.ui.getCore().byId("inputElDateClmfrm").setValue();
			sap.ui.getCore().byId("inputEmpMcertDate").setValue();
			sap.ui.getCore().byId("inputNamePosition").setValue();
			sap.ui.getCore().byId("inputElEstCostClm").setValue();
			sap.ui.getCore().byId("inputDay1").setValue();
			sap.ui.getCore().byId("inputShour").setValue();
			sap.ui.getCore().byId("inputELDATE").setValue();
			sap.ui.getCore().byId("inputName1").setValue();
			sap.ui.getCore().byId("inputElSchRegNo").setValue();
			sap.ui.getCore().byId("inputElDate").setValue();

		}
	});
});