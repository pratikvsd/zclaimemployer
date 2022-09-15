sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	return Controller.extend("safetysuitezclaimemployer.controller.Master", {

		onInit: function() {
			var oModel = this.getOwnerComponent().getModel("employerList");
			this.getView().setModel(oModel);
		},

		onPage2: function() {
			var page = this.getView().getParent();
			page.to("detailPage", "flip");

		}

	});

});