Hoot.tools = function (context, selection) {
    var loadingLayer = {},
        loadedLayers = {},
        activeConflateLayer = {},
        ETL = context.hoot().control.import,
        view = context.hoot().control.view,
        conflate = context.hoot().control.conflate;
        conflicts = context.hoot().control.conflicts,
        exportLayer = context.hoot().control.export,
        hoot = context.hoot(),
        colors = ['violet', 'orange'],
        exporting = false;
    hoot._conflicts = conflicts;
//    hoot.view = view;
    hoot.loadedLayers = function () {
        return loadedLayers;
    };
    hoot.reset = function () {
        resetAllLayers();
    };

    function conflationCheck(layerName, add, isPrimary) {
        function returnNewColor() {
            var imports = d3.selectAll('.hootImport').data();
            var views = _.map(d3.selectAll('.hootView').data(), function (d) {
                return d.color;
            });
            var currentColor = _.merge(imports, views);
            return (currentColor[0] === colors[0]) ? colors[1] : colors[0];
        }

        function addImportCheck(isPrimary) {
            if (_.keys(loadedLayers).length >= 2) {
                return;
            }
            var imports = d3.selectAll('.hootImport');
            var views = d3.selectAll('.hootView');
            d3.selectAll('.hootConflate').remove();
            var layerDivLength = imports.size() + views.size();

            // If user tries to add second layer before first layer is done loading we end up with
            // third Add data button. So we check to see if we are already loading.
            // Also search on hoot.isLayerLoading.
            var loadedLayers = hoot.model.layers.getLayers();
            var loadedLayersLen = Object.keys(loadedLayers).length;

            if (layerDivLength === 2 || loadedLayersLen > 1) {
                return false;
            }
            if (layerDivLength === 0) {
                ETL.render(colors);
                return true;
            }
            if (layerDivLength === 1) {
                var newColor = returnNewColor();
                ETL.render([newColor], isPrimary);
                return true;
            }

        }

        function addConflationCheck() {
            var check = _.filter(loadedLayers, function (a) {
                return a.loadable;
            });
            if (check.length === 2) {
                conflate.activate(check);
            }
            else {
                conflate.deactivate(check);
            }
        }


        if (!layerName) {
            addImportCheck();
            return;
        }
        var confLayers;
        if (!add) {
            confLayers = loadedLayers[layerName].layers;
            if (confLayers) {
                conflicts.deactivate();
                context.hoot().mode('browse');
                _.each(confLayers, function (d) {
                    hoot.model.layers.removeLayer(d);
                    d3.select('.layer_' + d).remove();
                    delete loadedLayers[d];
                });
            }
            delete loadedLayers[layerName];
        }
        if (add) {
            confLayers = loadedLayers[layerName].layers;
            if (confLayers) {
                _.each(confLayers, function (d) {
                    loadedLayers[d].loadable = false;
                    d3.select('.hootView.layer_' + loadedLayers[d].mapId).remove();
                });
            }
        }
        addImportCheck(isPrimary);
        addConflationCheck();
    }

    function resetAllLayers() {
        _.each(loadedLayers, function (d) {
            hoot.model.layers.removeLayer(d.name);
            var modifiedId = d.mapId.toString();
            d3.select('[data-layer="' + modifiedId + '"]').remove();
            delete loadedLayers[d.name];
        });

        d3.selectAll(d3.select('#sidebar2').node().childNodes).remove();
        conflicts.deactivate();
        conflationCheck();

    }

    function preConflation(a, layerName, advOpts) {
        // refactored code to use map id instead of map name
        var data = {};
        data.INPUT1 = view.getLayer(0).id;
        data.INPUT2 = view.getLayer(1).id;


        var refLayer = '1';
        var oRefLayer = a.select('.referenceLayer').datum();
        if(oRefLayer.id == data.INPUT2){
            refLayer = '2';
        }


        var _confType = {
            'Reference':'Reference',
            'Average':'Average',
            'Cookie Cutter & Horizontal':'Horizontal'
          };

        data.OUTPUT_NAME = a.select('.saveAs').value();
        data.CONFLATION_TYPE = _confType[a.select('.ConfType').value()] || a.select('.ConfType').value();
        //data.CONFLATION_TYPE = a.select('.ConfType').value();
        //data.MATCH_THRESHOLD = a.select('.matchThreshold').value();
        //data.MISS_THRESHOLD = a.select('.missThreshold').value();
        //Disable till swap approval
        data.GENERATE_REPORT = a.select('.isGenerateReport').value();

        var n = (new Date()).getTime();
        data.TIME_STAMP = "" + n;
        //data.AUTO_TUNNING = a.select('.autoTunning').value();
        data.REFERENCE_LAYER = refLayer;
        data.AUTO_TUNNING = 'false';

        if(advOpts){
            var advOptionsStr = "";
            _.each(advOpts, function(opt){
                if(advOptionsStr.length > 0){
                    advOptionsStr += " ";
                }
                advOptionsStr += '-D "' + opt.name + '=' + opt.value + '"';
            })
            data.ADV_OPTIONS = advOptionsStr;
        }/* else {
            // Do the default onew
            data.ADV_OPTIONS = '-D conflate.match.threshold=0.6 -D conflate.miss.threshold=0.6';
        }*/

        d3.selectAll('.hootView').remove();
        return data;
    }

    function postConflation(item,a) {
        var layers = inputLayers();

        _.each(layers, function (d) {
            //Changed from changeVisibility to ensure that input layers are invisible after conflation
          context.hoot().model.layers.setLayerInvisible(d);
        });

        item.merged = true;
        item.layers = layers;
        loadingLayer = item;
        _.each(loadedLayers, function (a) {
            a.loadable = false;
        });
        //d3.select('.loadingLayer').remove();
        hoot.model.layers.addLayer(item);

        //Add a folder and update links
        var pathname = a.select('.pathname').value();
        if(pathname==''){pathname=a.select('.reset.PathName').attr('placeholder');}
        if(pathname=='root'){pathname='';}
        var pathId = hoot.model.folders.getfolderIdByName(pathname) || 0;

        var newfoldername = a.select('.newfoldername').value();
        var folderData = {};
        folderData.folderName = newfoldername;
        folderData.parentId = pathId;
        hoot.model.folders.addFolder(folderData,function(folderId){
            //update map linking
            var link = {};
            link.folderId = folderId || 0;
            link.mapid = 0;
            if(a.select('.saveAs').value()){
                link.mapid =_.pluck(_.filter(hoot.model.layers.getAvailLayers(),function(f){return f.name == a.select('.saveAs').value()}),'id')[0] || 0;
            }
            if(link.mapid==0){return;}
            link.updateType='new';
            hoot.model.folders.updateLink(link);
            link = {};
        });

        /*var datasettable = d3.select('#datasettable');
        hoot.view.utilities.dataset.populateDatasetsSVG(datasettable);*/
    }


    function renderInputLayer(layerName,params) {
        loadedLayers[layerName] = params;
        loadedLayers[layerName].loadable = true;

        view.render(params);
        loadingLayer = {};
        d3.select('.loadingLayer').remove();

    }

    function renderMergedLayer(layerName) {
        loadedLayers[layerName] = loadingLayer;
        loadedLayers[layerName].loadable = true;
        loadedLayers[layerName].merged = true;
        activeConflateLayer = loadingLayer;
        loadedLayers[layerName] = _.extend(loadedLayers[layerName], loadingLayer);
        view.render(loadingLayer);
        loadingLayer = {};
        conflicts.activate(loadedLayers[layerName]);
        hoot.mode('edit');
        hoot.model.conflicts.beginReview(activeConflateLayer, function (d) {
            conflicts.startReview(d);
        });
    }

    function inputLayers() {
        return _.map(loadedLayers, function (d) {
            return d.name;
        });
    }

    ETL.on('addLayer', function (options) {

        if (hoot.model.layers.getLayers()[options.name]) {
            return false;
        }
        if (!options.name || !options.color) {
            return false;
        }
        loadingLayer = options;
        hoot.model.layers.addLayer(options);
    });
    view.on('layerRemove', function (layerName, isPrimary) {
        hoot.model.layers.removeLayer(layerName);
        conflationCheck(layerName, false, isPrimary);
    });
    view.on('layerColor', function (layerName, newColor, layerId) {
        hoot.changeColor(layerId, newColor);
        loadedLayers[layerName].color = newColor;
    });
    view.on('layerVis', function (layerName) {
        hoot.model.layers.changeVisibility(layerName);
    });
    conflicts.on('zoomToConflict', function (entity) {
//        context.hoot().view.ltdstags.activate(entity);
    });
    conflicts.on('exportData', function () {
        var mapid = activeConflateLayer.mapId;
        Hoot.model.REST('getMapSize', mapid,function (sizeInfo) {
//
            if(sizeInfo.error){
                return;
            }
            var expThreshold = 1*iD.data.hootConfig.export_size_threshold;
            var totalSize = 1*sizeInfo.size_byte;

            if(totalSize > expThreshold)
            {
                var thresholdInMb = Math.floor((1*expThreshold)/1000000);
                var res = window.confirm("Export data size is greater than " + thresholdInMb
                    +"MB and export may encounter problem." +
                    " Do you wish to continue?");
                if(res === false) {

                    return;
                }
            }

            conflicts.deactivate();
            context.hoot().mode('browse');
            Hoot.model.REST('getTranslations', function (trans) {
                exportLayer.activate(activeConflateLayer, trans);
            });
        });


    });
    conflicts.on('addData', function () {
        conflicts.deactivate();
        context.hoot().mode('browse');
   /*     resetAllLayers();
         d3.select('[data-layer=' + activeConflateLayer.name + ']').remove();
        hoot.addLayer({
            'name': activeConflateLayer.name,
            'color': 'orange'
        });

        activeConflateLayer = {};    */

        _.each(loadedLayers, function(d) {
            hoot.model.layers.removeLayer(d.name);
            var modifiedId = d.mapId.toString();
            d3.select('[data-layer="' + modifiedId + '"]').remove();
            delete loadedLayers[d.name];
        });

        d3.selectAll(d3.select('#sidebar2').node().childNodes).remove();
        d3.select('[data-layer="' + activeConflateLayer.mapId.toString() + '"]').remove();

        hoot.model.layers.addLayer({
            'name': activeConflateLayer.name,
            'color': 'orange'
        });

        activeConflateLayer = {};
    });
    conflicts.on('acceptAll', function (d) {
        hoot.mode('browse');
        hoot.model.conflicts.acceptAll(d, function () {
            conflicts.reviewNextStep();
        });
    });
    /*conflicts.on('removeFeature', function (d, mapid) {
        hoot.model.conflicts.RemoveFeature(d, mapid);
    });*/
    conflate.on('merge', function (a, layerName, advOptions) {

        var layers = inputLayers();
        // get map id
        var input1_id = context.hoot().model.layers.getmapIdByName(layers[0]);
        var input2_id = context.hoot().model.layers.getmapIdByName(layers[1]);
        // and then check size
        //getMapSize
        Hoot.model.REST('getMapSize', input1_id + "," + input2_id,function (sizeInfo) {
//
            if(sizeInfo.error){
                context.hoot().reset();
                return;
            }
            var confThreshold = 1*iD.data.hootConfig.conflate_size_threshold;
            var totalSize = 1*sizeInfo.size_byte;

            if(totalSize > confThreshold)
            {
                var thresholdInMb = Math.floor((1*confThreshold)/1000000);
                if(!window.confirm("Conflation data size is greater than " + thresholdInMb +
                    "MB and conflation may encounter problem. Do you wish to continue? (If you cancel layers will reset.)")) {
                    context.hoot().reset();
                    return;
                }
            }

            var _confType = {
                'Reference':'Reference',
                'Average':'Average',
                'Cookie Cutter & Horizontal':'Horizontal'
              };

            var data = preConflation(a, layerName, advOptions);
            var type = _confType[a.select('.ConfType').value()] || a.select('.ConfType').value();
            //var conflationExecType = (type === 'Horizontal') ? 'CookieCutterConflate' : 'Conflate';
            //Bug #6397
            var conflationExecType = 'Conflate';
            if(data.AUTO_TUNNING == 'true'){
                var data1 = {};
                data1.INPUT = data.INPUT1;
                data1.INPUT_TYPE = 'db';
                hoot.autotune('AutoTune', data1, function(res1){
                    var result1 = JSON.parse(res1.statusDetail);

                    data.INPUT1_ESTIMATE = "" + result1.EstimatedSize;
                    var data2 = {};
                    data2.INPUT = data.INPUT2;
                    data2.INPUT_TYPE = 'db';
                    hoot.autotune('AutoTune', data2, function(res2){
                        var result2 = JSON.parse(res2.statusDetail);
                        data.INPUT2_ESTIMATE = "" + result2.EstimatedSize;
                         hoot.model.conflate.conflate(conflationExecType, data, function (item) {
                             postConflation(item,a);
                         });
                    });
                });
            } else {

                hoot.model.conflate.conflate(conflationExecType, data, function (item) {
                    if(item.status && item.status == "requested"){
                        conflate.jobid = item.jobid;
                    } else {
                        postConflation(item,a);
                    }

                });
            }
        });



    });
    context.connection().on('layerAdded', function (layerName) {
        var params = hoot.model.layers.getLayers(layerName);
        if (loadedLayers[layerName]) return;

        var merged = loadingLayer.merged || null;
        if(!merged && params.mapId)
        {
            Hoot.model.REST('ReviewGetStatistics', params.mapId,function (stat) {
                var isReviewMode = false;
                if(stat.numReviewableItems > 0) {
                    var r = confirm("The layer contains unreviewed items. Do you want to go into review mode?");
                    if (r == true) {
                        isReviewMode = true;
                        loadingLayer = params;
                        loadingLayer['merged'] = true;
                        loadingLayer['layers'] = [];
                        d3.selectAll('.loadingLayer').remove();
                        d3.selectAll('.hootImport').remove();
                        d3.selectAll('.hootView').remove();
                        //renderMergedLayer(layerName);
                        // Broke a part renderMergedLayer
                        // The fix was to handle where loading source layers
                        // preempted the loading of the feature used by review
                        // moving the viewed location to wrong place.
                        // old sequence was
                        // load reviewed feature by control/conflicts.js
                        // load source 1
                        // load source 2
                        // hence we load review feature and move the center of source 2..
                        loadedLayers[layerName] = loadingLayer;
                        loadedLayers[layerName].loadable = true;
                        loadedLayers[layerName].merged = true;
                        activeConflateLayer = loadingLayer;
                        loadedLayers[layerName] = _.extend(loadedLayers[layerName], loadingLayer);
                        view.render(loadingLayer);
                        loadingLayer = {};
                        conflicts.activate(loadedLayers[layerName]);
                        hoot.mode('edit');

                        var reqParam = {};
                        reqParam.mapId = params.mapId
                        if(reqParam.mapId) {
                            Hoot.model.REST('getMapTags', reqParam,function (tags) {
                                var input1 = tags.input1;
                                var input2 = tags.input2;

                                var input1Name = tags.input1Name;
                                var input2Name = tags.input2Name;

                                var curLayer = loadedLayers[layerName];
                                curLayer.layers = [input1Name, input2Name];

                                if(input1 && input1Name) {
                                    var key = {
                                        'name': input1Name,
                                        'id':input1,
                                        'color': 'violet',
                                        'hideinsidebar':'true'
                                    };
                                    context.hoot().model.layers.addLayer(key, function(d){
                                        context.hoot().model.layers.setLayerInvisibleById(input1);

                                        if(input2 && input2Name) {
                                            var key2 = {
                                                'name': input2Name,
                                                'id':input2,
                                                'color': 'orange',
                                                'hideinsidebar':'true'
                                            };
                                            context.hoot().model.layers.addLayer(key2, function(d){
                                                context.hoot().model.layers.setLayerInvisibleById(input2);

                                                hoot.model.conflicts.beginReview(activeConflateLayer, function (d) {
                                                    conflicts.startReview(d);
                                                });

                                            });
                                        } else {
                                            alert("Could not determine input layer 2. It will not be loaded.");
                                        }


                                    });
                                } else {
                                    alert("Could not determine input layer 1. It will not be loaded.");
                                }


        
                            });
                        }
    
                    }
                }

                if(isReviewMode === false) {

                    var doRenderView = true;
                    if(params['hideinsidebar'] !== undefined && params['hideinsidebar'] === 'true'){
                        doRenderView = false;
                    }

                    if(doRenderView === true){
                        renderInputLayer(layerName,params);
                        conflationCheck(layerName, true);
                    } else {
                        loadedLayers[layerName] = params;
                        loadedLayers[layerName].loadable = true;
                        loadingLayer = {};
                    }
                }

            });



        } else {
            /*renderMergedLayer(layerName);
            conflationCheck(layerName, true);*/
            if (merged) {
                var sel = d3.select('.loadingLayer');
                if(sel && sel.node()){
                    sel.remove();
                }
                renderMergedLayer(layerName);
            }
            conflationCheck(layerName, true);
        }
    });
    exportLayer.on('cancelSaveLayer', function () {
        if(exporting){
            alert("Can not cancel. Export in progress.");
            return;
        }
        exportLayer.deactivate();
        resetAllLayers();
       /* d3.select('[data-layer=' + activeConflateLayer.name + ']').remove();
        hoot.addLayer({
            'name': activeConflateLayer.name,
            'color': 'orange'
        });*/
        activeConflateLayer = {};
    });
    exportLayer.on('saveLayer', function (cont, data) {
        var exportType = cont.select('.reset.fileExportFileType.combobox-input').value();
        exporting = true;
        var spinner = cont.append('span').attr('class', 'spinner-hoot').call(iD.ui.Spinner(context));
        hoot.model.export.exportData(cont, data, function (status) {
            if(status == 'failed'){
                alert('Export has failed or partially failed. For detail please see Manage->Log.');
            }

            if(exportType && exportType === 'Web Feature Service (WFS)'){
                var tblContainer = d3.select('#wfsdatasettable');
                context.hoot().view.utilities.wfsdataset.populateWFSDatasets(tblContainer);
            }

            spinner.remove();
            exportLayer.deactivate();
            resetAllLayers();
        });
    });
    conflationCheck();
};