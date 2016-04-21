iD.ui.Tools = function(context) {

    /*function saving() {
        return context.mode().id === 'tools';
    }*/
    
    function tools() {
         // If in review mode, do not include Clip tools
         var items = [];
         items.push({title:'Measurement Tools',icon:'line',group:'measure',items:[          
                {title:'Measure Length',tooltip:'Shortcut: 6',group:'measure',type:'line',icon:'line',mode:iD.modes.MeasureAddLine(context)},
                {title:'Measure Area',tooltip:'Shortcut: 7',group:'measure',type:'area',icon:'area',mode:iD.modes.MeasureAddArea(context)},
                {title:'Measure Help',tooltip:'',group:'measure',type:'help',icon:'help',action:'measureHelp'}
            ]});

        if (!hoot.control.conflicts.isConflictReviewExist()) {
            items.push({title:'Clip Tools',icon:'clip',group:'clip',items:[
                {title:'Clip to Visual Extent',tooltip:'Shortcut: 9',group:'clip',type:'area',icon:'clip',action:'clipVisualExtent'},
                {title:'Clip to Bounding Box',tooltip:'Shortcut: 8',group:'clip',type:'area',icon:'clip',mode:iD.modes.ClipBoundingBox(context)}
            ]});
        }

        d3.select('html').append('div').attr('class', 'tools-menu');

        if(d3.select('button.tools').text() === 'Clear'){
            d3.select('button.tools').text('Tools');
            return;
        }
               
        var toolsItem =  d3.selectAll('.tools-menu')
            .html('')
            .append('ul')
            .selectAll('li')
            .data(items).enter()
            .append('li')
            .attr('class',function(item){return item.icon + ' tools-' + item.group;})
            .on('mouseenter',function(item){
                if(!item.items){return;}
                var itemHeight = d3.select('.tools-'+item.group).node().offsetTop+116+'px';
                d3.select('.tools-menu.sub-menu').remove();
                d3.select('html').append('div').attr('class','tools-menu sub-menu');
                var subTools = d3.selectAll('.tools-menu.sub-menu')
                    .style('left', function(){
                        var menuWidth = d3.select('.tools-menu').node().offsetWidth+1;
                        return menuWidth+d3.select('button.tools').property('offsetLeft')+'px'||'0px';})
                    .style('top', itemHeight)
                    .style('display', 'block')
                    .html('')
                    .append('ul')
                    .selectAll('li')
                    .data(item.items).enter()
                    .append('li')
                    .attr('class',function(item){
                        return item.icon + ' tools-' + item.group;})
                    .on('click' , function(item) {
                        if(item.items){return;}
                        if(item.mode){
                            context.enter(item.mode);
                        } else if (item.action === 'clipVisualExtent'){
                            //Call clip map
                            if(!_.isEmpty(context.hoot().model.layers.getLayers())){
                                context.hoot().control.utilities.clipdataset.clipDatasetContainer('visualExtent');
                            } else {
                                iD.ui.Alert('Add data to map before clipping.','notice',new Error().stack);
                            }
                        } else if (item.action==='measureHelp'){
                            iD.ui.Alert('Click anywhere on the map to start measuring.  Double-click to end measurement. Clicking on the Tools menu will clear the vectors from the screen.','notice');
                        }
                        d3.select('.tools-menu').remove();
                        d3.select('.sub-menu').remove();
                      })
                    .each(function(item){
                        d3.select(this).call(iD.svg.Icon('#icon-' + item.icon, 'pre-text'));
                    });

                subTools.append('span').text(function(item) { return item.title; }).attr('title',(function(item){return item.tooltip||'';}));
            });
        
            toolsItem.append('span').text(function(item) { return item.title; });
            
        d3.select('.tools-menu').style('display', 'none');
        d3.select('.sub-menu').style('display', 'none');
        
        // show the context menu
        d3.select('.tools-menu')
            .style('left', function(){return d3.select('button.tools').property('offsetLeft')+'px'||'0px';})
            .style('top', '120px')
            .style('display', 'block');

        //close menu
        var firstOpen = true;
        d3.select('html').on('click.tools-menu',function(){
            if(firstOpen){
               firstOpen=false;
            } else {
                d3.select('.tools-menu').style('display', 'none');
                d3.select('.sub-menu').style('display', 'none');
            }
        });

        d3.event.preventDefault();
    }

    return function(selection) {
        var button = selection.append('button')
            .attr('class', 'tools col12')
            .attr('tabindex', -1)
            .on('click', tools);

        button.append('span')
            .attr('class', 'label')
            .text(t('tools.title'));
    };
};
