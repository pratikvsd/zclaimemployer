sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"safetysuitezclaimemployer/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("safetysuitezclaimemployer.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		
		},

		createContent: function() {
			var oApp = new sap.ui.view("app", {
				viewName: "safetysuitezclaimemployer.view.App",
				type: "XML"
			});
			var oMasterPage = new sap.ui.view("masterPage", {
				viewName: "safetysuitezclaimemployer.view.Master",
				type: "XML"
			});
			var oDetailPage = new sap.ui.view("detailPage", {
				viewName: "safetysuitezclaimemployer.view.Detail",
				type: "XML"
			});
			var oParentPage = oApp.byId("app");
			oParentPage.addMasterPage(oMasterPage);
			oParentPage.addDetailPage(oDetailPage);

			return oApp;
		}
	});
});