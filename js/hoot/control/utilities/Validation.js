Hoot.control.utilities.validation = function(context) {
	var hoot_control_utilities_validation = {};

    hoot_control_utilities_validation.validationPopup = function(srcName, callback) {

        var source = srcName;
        var d_form = [{
            label: 'Output Name',
            placeholder: 'Save As',
            type: 'ValidationName'
        }];



        var d_btn = {
            'label' : 'Run',
            'action' : function(formContainer, btnContainer, form){
                // spinner
                var spinDiv =  btnContainer.append('div')
                    .classed('form-field col1 center valspinner', true);
                spinDiv.call(iD.ui.Spinner(context));
          
                var output = form.select('.reset.ValidationName').value();

                if(output){
                    var reqParam = {};
                    reqParam.sourceMap = source;
                    reqParam.outputMap = output;

                    Hoot.model.REST('createValidationMap', reqParam, function (resp) {   
                        if(resp.status != 'complete') {
                            alert("Failed to create validation. See log for detail.");
                        } else {
                            // refresh both folder and layer list
                            context.hoot().model.layers.refresh(function(){
                                context.hoot().model.folders.refreshLinks(function(){
                                    context.hoot().model.import.updateTrees();
                                })
                            })
                        }                                  
                        formContainer.remove();
                        
                    });
                } else {
                    alert('Please specify valid Output Name!');
                    spinDiv.remove();
                }
            }
        };

        var d_container = {};
        d_container.label = 'Prepare For Validation';
        var modalbg = context.hoot().control.createModalDialog(context, d_container, d_form, d_btn); 

            
        
        return modalbg;
    };



	return hoot_control_utilities_validation;
}
