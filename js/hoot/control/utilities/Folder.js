Hoot.control.utilities.folder = function(context) {
	var selectedLayerIDs = [];
	
	var hoot_control_utilities_folder = {};

    hoot_control_utilities_folder.createFolderTree = function(container) {
    	selectedLayerIDs = [];
    	context.hoot().model.layers.setSelectedLayers(selectedLayerIDs);
    	
    	// http://bl.ocks.org/mbostock/1093025 - Collapsible Indented Tree
    	
    	//var folders = context.hoot().model.layers.getAvailLayersWithFolders();
    	var folders = context.hoot().model.folders.getAvailFoldersWithLayers();
    	folders= JSON.parse('{"name":"Datasets","id":"Datasets","children":' + JSON.stringify(folders) +'}');
	
    	var margin = {top: 10, right: 20, bottom: 30, left: 0},
	        width = '100%',
	        height = '100%',
	        barHeight = 20,
	        barWidth = 100;
    	
    	var x = d3.scale.linear()
	    	.domain([0, 0])
	    	.range([0, 0]);
	
	    var y = d3.scale.linear()
	    	.domain([0, 10])
	    	.range([20, 0]);
	    
	    var zoom = d3.behavior.zoom()
			.scaleExtent([1, 2])
			.x(x)
			.y(y)
			.on("zoom", zoomed);
    	
	    var i = 0,
	        duration = 400,
	        root;
	
	    var tree = d3.layout.tree()
	        .nodeSize([0, 20]);
	
	    var diagonal = d3.svg.diagonal()
	        .projection(function(d) { return [d.y, d.x]; });
	   
	    //Remove any existing nodes
	    var svg;
	    var _svg = container.selectAll('svg');
		if(!_svg.empty()){
			//_svg.remove();
			_svg.selectAll('g').remove();
			svg = _svg.append("g")	
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		} else {
			svg = container.append("svg")
	        	.attr("width", width)// + margin.left + margin.right)
	        	.attr("height", height)// + margin.left + margin.right)
	        	.append("g")
	        	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		}
		
		/*var svg = container.append("svg")
	        .attr("width", width)// + margin.left + margin.right)
	        .attr("height", height)// + margin.left + margin.right)
	        .append("g")
	        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");*/
	        //.call(zoom);
	   
		folders.x0=0;
		folders.y0=0;
		
		update(root=folders);
		
		function zoomed() {
			var svgHt = svg.node().getBoundingClientRect().width; 
			var rectHt = 20*(svg.selectAll('rect')[0].length-1);
			var tx = 0,
				ty = Math.min(10, Math.max(-rectHt,rectHt-svgHt,  d3.event.translate[1]));
			zoom.translate([tx, ty]);
			svg.attr("transform", "translate(" + [tx,ty] + ")scale(" + d3.event.scale + ")");
		}

		function showPrepValidationPopup(selLayer) {
			var dataset = _.findWhere(context.hoot().model.layers.getAvailLayers(),{id:selLayer[0]});
			context.hoot().control.utilities.validation.validationPopup(dataset.name, function(jobs){
			});
		}

		function showFilterPopup(selLayer) {
			var dataset = _.findWhere(context.hoot().model.layers.getAvailLayers(),{id:selLayer[0]});
			context.hoot().control.utilities.filter.filterPopup(dataset.name, function(jobs){
			});
		}
		
	    function update(source) {
	
	      // Compute the flattened node list. TODO use d3.layout.hierarchy.
	      var nodes = tree.nodes(root);

	      var height = Math.max(400, nodes.length * barHeight + margin.top + margin.bottom);
	      
	      //replaced container with d3
	      container.select("svg").transition()
	          .duration(duration)
	          .attr("height", height + "px");
	
	      container.select(self.frameElement).transition()
	          .duration(duration)
	          .style("height", height + "px");
	      	      
	      // Compute the "layout".
	      nodes.forEach(function(n, i) {
	        n.x = i * barHeight;
	      });
	
	      // Update the nodes…
	      var node = svg.selectAll("g.node")
	          .data(nodes, function(d) {
	        	  if(d.type){return d.type.charAt(0) + d.id || d.id || (d.id = ++i);}
	        	  else{return d.id || (d.id = ++i);}
	        	  });
	
	      var nodeEnter = node.enter().append("g")
	          .attr("class", "node")
	          .attr("transform", function(d) { return "translate(" + 0 + "," + source.x0 + ")"; })
	          .style("opacity", 1e-6);
	      	      
	      // Enter any new nodes at the parent's previous position.
	      nodeEnter.append("rect")
	          .attr("y", -barHeight / 2)
	          .attr("height", barHeight)
	          .attr("width", function(d){
	        	  return '100%';})
	          .style("fill", color)
	          .attr("class", rectClass)
	          .on("click", click);
	          
	      nodeEnter.append("text")
	          .attr("dy", 3.5)
	          .attr("dx", function(d){
	        	  if(d.type){return  25.5+(11*d.depth);}
	        	  else{return 11*d.depth;}})	//5.5
	          .text(function(d) { return d.name; })
	          .each(function(d){
	        	  var rectNode = d3.select(this);
	        	  if(d.type=='dataset'){
	        		  rectNode.attr('lyr-id',function(d){return d.id;})
	        	 } else if (d.type=='folder'){
	        		 rectNode.attr('fldr-id',function(d){return d.id;})
	        	 }
	          });
	      
	      if(container.attr('id')=='datasettable'){
		      nodeEnter.filter(function(d){return d.type=='dataset'}).append("text")
		      		.attr("dy",3.5)
		    		.attr("dx",function(d){
		    			return '75%';
		    		})
		    		.attr('text-anchor','end')
		    		.text(function(d) { 
		    			return d.date;
	    			});
	      }
	      
	      nodeEnter.filter(function(d){return d.type=='dataset'}).append("text")
    		.attr("dy",3.5)
	  		.attr("dx",function(d){
	  			return '90%';
	  		})
	  		.attr('text-anchor','end')
	  		.text(function(d) { 
	  			if(Math.abs(d.size) < 1000) {return d.size + ' B';}
	  			var units = ['kB','MB','GB','TB','PB','EB','ZB','YB'];
	  			var u = -1;
	  			do {
	  				d.size /= 1000;
	  		        ++u;
	  		    } while(Math.abs(d.size) >= 1000 && u < units.length - 1);
	  		    return d.size.toFixed(1)+' '+units[u];
			});	  
	      
	      var nodeg = nodeEnter.append("g");
	      nodeg.append('svg:foreignObject')
		      .attr("width", 20)
		      .attr("height", 20)
		      .attr("transform", function(d) { 
		    	  var dy=5.5+(11*d.depth);
		    	  return "translate("+ dy +",-11)"; })
		      .html(function(d){
		    	  if (d.type == 'folder'){
		    		  if(d.state=="open"){return '<i class="_icon openfolder"></i>'}
		    		  else{return '<i class="_icon folder"></i>'}
		    	  }
		    	  if (d.type == 'dataset'){return '<i class="_icon data"></i>'}
		      });
	            
	      // Transition nodes to their new position.
	      nodeEnter.transition()
	          .duration(duration)
	          .attr("transform", function(d) { return "translate(" + 0 + "," + d.x + ")"; })
	          .style("opacity", 1);
	
	      node.transition()
	          .duration(duration)
	          .attr("transform", function(d) { return "translate(" + 0 + "," + d.x + ")"; })
	          .style("opacity", 1)
	        .select("rect")
	          .style("fill", color)
	          .attr("class", rectClass);
	
	      // Transition exiting nodes to the parent's new position.
	      node.exit().transition()
	          .duration(duration)
	          .attr("transform", function(d) { return "translate(" + 0 + "," + source.x + ")"; })
	          .style("opacity", 1e-6)
	          .remove();
	
	      // Update the links…
	      var link = svg.selectAll("path.link")
	          .data(tree.links(nodes), function(d) { return d.target.id; });
	
	      // Enter any new links at the parent's previous position.
	      link.enter().insert("path", "g")
	          .attr("class", "link")
	          .attr("d", function(d) {
	            var o = {x: source.x0, y: source.y0};
	            return diagonal({source: o, target: o});
	          })
	        .transition()
	          .duration(duration)
	          .attr("d", diagonal);
	
	      // Transition links to their new position.
	      link.transition()
	          .duration(duration)
	          .attr("d", diagonal);
	
	      // Transition exiting nodes to the parent's new position.
	      link.exit().transition()
	          .duration(duration)
	          .attr("d", function(d) {
	            var o = {x: source.x, y: source.y};
	            return diagonal({source: o, target: o});
	          })
	          .remove();
	
	      // Stash the old positions for transition.
	      nodes.forEach(function(d) {
	        d.x0 = d.x;
	        d.y0 = d.y;
	      });

	      if(container.attr('id')=='datasettable'){
	    	  container.selectAll('rect').on("contextmenu",function(d,i){
	    		  if(!d3.event.ctrlKey || container.attr('id')==null){
	    	    	  _.each(nodes,function(n){n.selected=false;});  
	    	    	  if(d.type=='dataset'){d.selected=true;}
	    	      } else if(d3.event.ctrlKey && container.attr('id')=='datasettable' && d.type=='dataset') {
	    	    	  d.selected = !d.selected;
	    	      }
	    		  
	    		  update(d);
	    		  
	    		  var items = [];
	              if(!d.type){
	            	  d3.select('.context-menu').style('display', 'none');	              
		              d3.event.preventDefault();
		              return;
	              }
	              else if(d.type.toLowerCase()=='dataset'){
	            	  d.selected=true;
	            	  d3.select(this).classed('sel',true);
	            	  if(selectedLayerIDs.indexOf(d.id) == -1){selectedLayerIDs.push(d.id);}
	            	  context.hoot().model.layers.setSelectedLayers(selectedLayerIDs);
	            	  
	            	  
	            	  
	            	  //http://jsfiddle.net/1mo3vmja/2/
	            	  items = [
		        	      {title:'Export',icon:'export',click:'exportDataset'},
		        	      {title:'Delete (' + hoot.model.layers.getSelectedLayers().length +')',icon:'trash',click:'deleteDataset'},
		        	      {title:'Move (' + hoot.model.layers.getSelectedLayers().length +')',icon:'info',click:'moveDataset'},
		        	      {title:'Rename ' + d.name,icon:'info',click:'renameDataset'},
		        	      {title:'Prepare for Validation',icon:'sprocket',click:'prepValidation'},
		        	      {title:'Filter non-HGIS POIs',icon:'sprocket',click:'filter'}
		        	  ]; 
            	  } else if (d.type.toLowerCase()=='folder') {
	        		  items = [
	 		        	      {title:'Delete',icon:'trash',click:'deleteFolder'},
	 		        	      {title:'Rename/Move ' + d.name,icon:'info',click:'modifyFolder'},
	 		        	      {title:'Add Dataset',icon:'data',click:'addDataset'},
	 		        	      {title:'Add Folder',icon:'folder',click:'addFolder'}
	 		        	  ];
		        	  } else {
		        		  d3.select('.context-menu').style('display', 'none');	              
			              d3.event.preventDefault();
			              return;
		        	  }
		        	  
		        	  // create the div element that will hold the context menu
		              d3.selectAll('.context-menu').data([1])
		              	.enter()
		                .append('div')
		                .attr('class', 'context-menu');
		              // close menu
		              d3.select('body').on('click.context-menu', function() {d3.select('.context-menu').style('display', 'none');});
		              // this gets executed when a contextmenu event occurs
		              d3.selectAll('.context-menu')
		              	.html('')
		                .append('ul')
		                .selectAll('li')
		                .data(items).enter()
		                .append('li')
		                .on('click' , function(item) { 
		                	switch (item.click) {
		                	//Datasets
		                	case 'exportDataset': context.hoot().view.utilities.dataset.exportDataset(d,container); break;
		                	case 'deleteDataset': context.hoot().view.utilities.dataset.deleteDatasets(hoot.model.layers.getSelectedLayers(),container); break;
		                	case 'moveDataset': context.hoot().view.utilities.dataset.moveDatasets(hoot.model.layers.getSelectedLayers()); break;
		                	case 'renameDataset': context.hoot().view.utilities.dataset.modifyDataset(d); break;
		                	case 'prepValidation': showPrepValidationPopup(hoot.model.layers.getSelectedLayers()); break;
		                	case 'filter': showFilterPopup(hoot.model.layers.getSelectedLayers()); break;
		                	
		                	//Folders
							case 'deleteFolder': context.hoot().view.utilities.dataset.deleteDataset(d,container); break;
							case 'modifyFolder': context.hoot().view.utilities.dataset.modifyDataset(d); break;
							case 'addDataset': Hoot.model.REST("getTranslations",function(e){
											   		if(d.error){context.hoot().view.utilities.errorlog.reportUIError(d.error);return;}
											   		context.hoot().control.utilities.dataset.importDataContainer(e,d)
											   	}); break;
							case 'addFolder': context.hoot().control.utilities.folder.importFolderContainer(d); break;
							default:
								break;
							}

		                	d3.select('.context-menu').remove();
		                })
		                .attr("class",function(item){return "_icon " + item.icon})
	            		.text(function(item) { return item.title; });
		              	d3.select('.context-menu').style('display', 'none');
		              // show the context menu
		              d3.select('.context-menu')
		                .style('left', (d3.event.pageX - 2) + 'px')
		                .style('top', (d3.event.pageY - 2) + 'px')
		                .style('display', 'block');
	              //} else {d3.select('.context-menu').style('display', 'none');}	              
	              d3.event.preventDefault();
	          });
	      } else {container.selectAll('rect').on("contextmenu",function(d,i){d3.event.preventDefault();})}
	    }
	    
	    // Toggle children on click.
	    // If no children, consider it a dataset!
	    function click(d) {
	      var nodes = tree.nodes(root);
	      
	      if(!d3.event.ctrlKey || container.attr('id')==null){
	    	  _.each(nodes,function(n){n.selected=false;});  
	    	  if(d.type=='dataset'){d.selected=true;}
	      } else if(d3.event.ctrlKey && container.attr('id')=='datasettable' && d.type=='dataset') {
	    	  d.selected = !d.selected;
	      }
	    	
	      if(d.type=='folder'){selectedLayerIDs = context.hoot().model.layers.setSelectedLayers([]);}
	      
	      d3.select(this).classed("selected",true);
	      var updateOpenFolders = !d3.select("#datasettable").selectAll('.selected').empty();
	      
	      
	      if(d.type=='folder'){
	    	  if (d.children || typeof(d.children)=="object") {
		    	  //folder closing
		    	  d._children = d.children;
		    	  d.children = null;
		    	  d.selected = false;
		    	  if(updateOpenFolders){
		    		  context.hoot().model.folders.setOpenFolders(d.id,false);
		    		  d.state='closed';
		    		  d3.select(this.parentNode).select('i').classed('folder',true).classed('openfolder',false);
		    	  }
		      } else if(d.children==null && d._children==null){
		    	  //toggle an empty folder
		    	  if (d.state=="open"){
		    		  d.state="closed";
		    		  d3.select(this.parentNode).select('i').classed('folder',true).classed('openfolder',false);
		    	  } else {
		    		  d.state="open";
		    		  d3.select(this.parentNode).select('i').classed('folder',true).classed('openfolder',true);
		    	  }
		      } else {
		    	  //folder opening
		    	  d.children = d._children;
		    	  d._children = null;
		    	  if(updateOpenFolders){
		    		  context.hoot().model.folders.setOpenFolders(d.id,true);
		    		  d.state='open';
		    		  d3.select(this.parentNode).select('i').classed('folder',false).classed('openfolder',true);
		    	  }
		      }	    	  
	      }

	      d3.select(this).classed("selected",false);
	      update(d);
	    }
	
	    function color(d) {
	      //return d.selected ? "#ffff99" : d._children ? "#3182bd" : "#c6dbef";
	    	//http://meyerweb.com/eric/tools/color-blend
	    	var gradient = ['#84B3D9','#8DB9DC','#97BEDF','#A0C4E2','#AACAE6','#B3D0E9','#BDD5EC','#C6DBEF']
	    	return d._children ? "#3182bd" : d.depth<=gradient.length-1 ? gradient[d.depth] : gradient[gradient.length-1];
	    }
	    
	    function rectClass(d) {
	    	//set selected layers
	    	if(d.type=='dataset' && container.attr('id')=='datasettable'){
	    		var lyrid = d.id;
		    	if(d.selected){
		    		if(selectedLayerIDs.indexOf(lyrid) == -1){selectedLayerIDs.push(lyrid);}		
		    	} else {
		    		var idx = selectedLayerIDs.indexOf(lyrid);
		    		if(idx > -1){selectedLayerIDs.splice(idx,1);}
		    	}	      
		    	context.hoot().model.layers.setSelectedLayers(selectedLayerIDs);		      
	    	}
	    	
	    	return d.selected ? "sel" : d._children ? "more" : "flat";
		}
	    
	    function getWidth(d) {
	    	return '100%';
	    }
    }

    hoot_control_utilities_folder.importFolderContainer = function (data) {
    	hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
        var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);
        
        var d_form = [{
        	label: 'Folder Name',
        	placeholder:'',
        	type:'NewFolderName'
        }];
        var modalbg = d3.select('body')
            .append('div')
            .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
        var ingestDiv = modalbg.append('div')
            .classed('contain col4 pad1 hoot-menu fill-white round modal', true);
        var _form = ingestDiv.append('form');
        _form.classed('round space-bottom1 importableLayer', true)
            .append('div')
            .classed('big pad1y keyline-bottom space-bottom2', true)
            .append('h4')
            .text('Add Folder')
            .append('div')
            .classed('fr _icon x point', true)
            .on('click', function () {
                //modalbg.classed('hidden', true);
                modalbg.remove();
            });
        var fieldset = _form.append('fieldset')
            .selectAll('.form-field')
            .data(d_form);
        fieldset.enter()
            .append('div')
            .classed('form-field fill-white small keyline-all round space-bottom1', true)
            .append('label')
            .classed('pad1x pad0y strong fill-light round-top keyline-bottom', true)
            .text(function (d) {
                return d.label;
            });
        fieldset.append('div')
            .classed('contain', true)
            .append('input')
            .attr('type', 'text')
            .attr('placeholder', function (field) {
                return field.placeholder;
            })
            .attr('class', function (field) {
                return 'reset ' + field.type;
            })
            .select(function (a) {

                function getTypeName(desc){
                    var comboData = _form.select('.reset.importImportType').datum();
                    var typeName = "";
                    for(i=0; i<comboData.combobox2.length; i++){
                        var o = comboData.combobox2[i];
                        if(o.title == desc){
                            typeName = o.value;
                            break;
                        }

                    }
                    return typeName;
                };

                if (a.combobox3) {
                	var comboPathName = d3.combobox()
                        .data(_.map(a.combobox3, function (n) {
                            return {
                                value: n.name,
                                title: n.id
                            };
                        }));

                    comboPathName.data().sort(function(a,b){
                    	var textA = a.value.toUpperCase();
                    	var textB=b.value.toUpperCase();
                    	return(textA<textB)?-1 : (textA>textB)?1:0;
                    });
                    
                    comboPathName.data().unshift({value:'root',title:0});
                    
                    d3.select(this)
                    	.style('width', '100%')
                    	.call(comboPathName);
                    
                    d3.select(this).attr('readonly',true);                        
                }
            });

        	var folderId = 0;
        	if(data){
	        	if(_.map(hoot.model.folders.getAvailFolders(),function(n){return n.id}).indexOf(data.id)>=0){
	        		folderId=data.id;
	        	}
	        }
        
            var submitExp = ingestDiv.append('div')
            .classed('form-field col12 left ', true);
             submitExp.append('span')
            .classed('round strong big loud dark center col10 margin1 point', true)
            .classed('inline row1 fl col10 pad1y', true)
                .text('Add Folder')
                .on('click', function () {
                    //check if layer with same name already exists...
                	if(_form.select('.reset.NewFolderName').value()=='' || _form.select('.reset.NewFolderName').value()==_form.select('.reset.NewFolderName').attr('placeholder')){
                		iD.ui.Alert("Please enter an output folder name.",'warning');
                        return;
                	}
                	
                	resp = context.hoot().checkForUnallowedChar(_form.select('.reset.NewFolderName').value());
                	if(resp != true){
                		iD.ui.Alert(resp,'warning');
                		return;
                    }
                	
                	/*if(_.map(hoot.model.folders.getAvailFolders(),function(n){return n.id}).indexOf(this.id)>=0){
                		folderId=this.id;
                	}*/
                	
                	if(_.findWhere(hoot.model.folders.getAvailFolders(),{name:_form.select('.reset.NewFolderName').value(),parentId:folderId})){
                		iD.ui.Alert("Please use a different name, as you are about to create a folder with a name identical to a folder at the same level.",'warning')
                		return;
                	}
                	
                	var data={};
                	data.parentId=folderId;
                	data.folderName = _form.select('.reset.NewFolderName').value();
                	
                	var callback = function(){console.log('success');}
                	
                    Hoot.model.REST('addFolder',data,function(a){
                        hoot.model.folders.refresh(function () {
                        	hoot.model.folders.refreshLinks(function(){
                        		hoot.model.layers.RefreshLayers();
                        		modalbg.remove();
                        	});
                        });
                    });
                });
        return modalbg;
    }

	 hoot_control_utilities_folder.modifyNameContainer = function(folder) {
			hoot.model.folders.listFolders(hoot.model.folders.getAvailFolders());
		    var folderList = _.map(hoot.model.folders.getAvailFolders(),_.clone);
		    var folderId = folder.parentId || 0;
		    
		    var placeholder = 'root';
			if(folderId > 0){
				var match = _.findWhere(folderList,{id:folderId});
				if(match){
					if(match){placeholder = match.folderPath};
				}
			 }
		    
		 var d_form = [{
	            label: 'Output Name',
	            type: 'fileOutputName',
	            placeholder: folder.name,
	            inputtype:'text'
	        },{
         	label: 'Path',
         	type: 'pathname',
         	placeholder:placeholder,
         	combobox:folderList
         }];
	        var modalbg = d3.select('body')
	            .append('div')
	            .classed('fill-darken3 pin-top pin-left pin-bottom pin-right', true);
	        var ingestDiv = modalbg.append('div')
	            .classed('contain col4 pad1 hoot-menu fill-white round modal', true);
	        var _form = ingestDiv.append('form');
	        _form.classed('round space-bottom1 importableLayer', true)
	            .append('div')
	            .classed('big pad1y keyline-bottom space-bottom2', true)
	            .append('h4')
	            .text('Modify ' + folder.type.charAt(0).toUpperCase() + folder.type.slice(1).toLowerCase())
	            .append('div')
	            .classed('fr _icon x point', true)
	            .on('click', function () {
	                modalbg.remove();
	            });
	        var fieldset = _form.append('fieldset')
	            .selectAll('.form-field')
	            .data(d_form)
	            ;
	        fieldset.enter()
	            .append('div')
	            .classed('form-field fill-white small keyline-all round space-bottom1', true)
	            .html(function (d) {
	                	return '<label class="pad1x pad0y strong fill-light round-top keyline-bottom">' + d.label; // + '</label><input type="text" class="reset ' + field.type + '" />';
	                });
	        fieldset.append('div')
	            .classed('contain', true)
	            .append('input')
	            .attr('type', 'text')
	            .attr('placeholder', function (field) {return field.placeholder;})
	            .attr('class', function (field) {return 'reset ' + field.type;})
	            .select(function(a){
	                if (a.combobox){
	                    var comboPathName = d3.combobox()
	                        .data(_.map(a.combobox, function (n) {
	                            return {
	                            	value: n.folderPath,
	                                title: n.folderPath
	                            };
	                        }));

	                    comboPathName.data().sort(function(a,b){
	            		  	var textA = a.value.toUpperCase();
	            		  	var textB=b.value.toUpperCase();
	            		  	return(textA<textB)?-1 : (textA>textB)?1:0;
	            		  });
	                    
	                    comboPathName.data().unshift({value:'root',title:0});
	                    
	                    d3.select(this)
	                    	.style('width', '100%')
	                    	.call(comboPathName);
	                    
	                    d3.select(this).attr('readonly',true); 
	                }
	            });

	        var submitExp = ingestDiv.append('div')
	        .classed('form-field col12 center ', true);
	         submitExp.append('span')
	        .classed('round strong big loud dark center col10 margin1 point', true)
	        .classed('inline row1 fl col10 pad1y', true)
	            .text('Update')
	            .on('click', function () {
	            	var pathname = _form.select('.pathname').value()
	                if(pathname==''){pathname=_form.select('.pathname').attr('placeholder');}
	                if(pathname=='root'){pathname='';}
	                var pathId = hoot.model.folders.getfolderIdByName(pathname) || 0;
	                	                
	                var outputname =_form.select('.fileOutputName').value();
	                if(outputname==''){outputname=_form.select('.fileOutputName').attr('placeholder');}
	                var resp = context.hoot().checkForUnallowedChar(outputname);
	             	if(resp != true){
	             		iD.ui.Alert(resp,'warning');
	             		return;
	                 }
	             	
	             	data = {};
	             	data.inputType = folder.type;
	             	data.mapid = folder.id;
	             	data.modifiedName = outputname;
	             	data.folderId = pathId;
	             	
	                context.hoot().model.layers.updateLayerName(data, function(status){
	                	//you arent updating a link, you are reassigning a value in the folder table
	                	var folderData = {};
	                	folderData.parentId=data.folderId;
	                	folderData.folderId=data.mapid;
	                	
	                	Hoot.model.REST('updateFolder',folderData,function(a){
	                		hoot.model.folders.refresh(function(){
	                			context.hoot().model.import.updateTrees();
	                		});
	                		modalbg.remove();
	                	});
	                });
	            });

	        return modalbg;
		};
    
	return hoot_control_utilities_folder;
};
