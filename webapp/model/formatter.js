sap.ui.define(
	function() {
		"use strict";
		
		return{
			status: function(vDate) {
				if(vDate){
					vDate = new Date(vDate);
				}
				 
				return vDate;
			}
				
	
		};
			

	});