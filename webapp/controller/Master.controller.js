sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	return Controller.extend("safetysuitezclaimemployer.controller.Master", {

		onInit: function() {
			debugger;
		},

		onPage2: function() {
			var page = this.getView().getParent();
			page.to("detailPage", "flip");

		}

	});

});