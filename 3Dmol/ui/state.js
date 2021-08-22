
/**
 * $3Dmol.StateManager - StateManager creates the space to preserve the state of the ui and sync it with the GLViewer
 * @constructor 
 * @param {$3Dmol.GLViewer} glviewer StateManager is required to have interaction between glviewer and the ui. 
 * @param {Object} config Loads the user defined parameters to generate the ui and handle state
 */
$3Dmol.StateManager = (function(){

  function States(glviewer, config){
    config = config || {};
    config.ui = config.ui || false;
    console.log('State Manager Initiated For the viewer', glviewer);
    console.log('Viewer Configuration', );


    var canvas = $(glviewer.getRenderer().domElement);
    var parentElement = glviewer.container;
    console.log('Container', parentElement, canvas.height(), canvas.width(), parentElement.height(), parentElement.width());
    var height = parentElement.height();
    var width = parentElement.width();
    var offset = canvas.offset();
    var stateManager = this;

    var uiOverlayConfig = {
      height : height,
      width : width,
      offset : offset,
      ui : config.ui || undefined
    }

    // console.log('')
    // Selection Handlers
    var selections = {};

    // Surface handlers
    var surfaces = {};

    // Label Handlers
    var labels = {};

    var atomLabel = {};

    /**
     * Add Selection from the ui to glviewer
     * 
     * @function $3Dmol.StateManager#addSelection
     * @param {Object} spec Object that contains the output from the form 
     * @param {String} sid If surface id being edited then sid is set to some string
     * @returns String
     */
    this.addSelection = function(spec, sid = null){
      // console.log('Add Selection Called');
      var id = sid || makeid(4);
      var selectionSpec = {
        spec : spec,
        styles : {},
        hidden : false
      }

      if(sid == null)
        selections[id] = selectionSpec;
      else 
        selections[id].spec = selectionSpec.spec;

      console.log("StateManager::addSelection", selections, sid);
      render();
      return id;
    }

    /**
     * Return true if the selections contain at least one atom
     * 
     * @function $3Dmol.StateManager#checkAtoms
     * @param {AtomSelectionSpec} sel Atom selection spec
     * @returns Boolean
     */
    this.checkAtoms = function(sel){
      var atoms = glviewer.selectedAtoms(sel);
      if( atoms.length > 0)
        return true

      return false;
    }

    /**
     * Toggle the hidden property of the selection 
     * @function $3Dmol.StateManager#toggleHide
     * @param {String} sid Selection id
     */
    this.toggleHide = function(sid){
      selections[sid].hidden = !selections[sid].hidden;
      console.log('toggle hide', selections, selections[sid]);
      render();
    }

    /**
     * Removes the selection
     * @param {String} id Selection id
     */
    this.removeSelection = function(id) {
      delete selections[id];
      render();
    }

    /**
     * Add style and renders it into the viewport
     * 
     * @function $3Dmol.StateManager#addStyle 
     * @param {String} spec Output object of style form 
     * @param {String} sid Selection Id
     * @param {String} stid Style Id
     * @returns String
     */
    this.addStyle = function( spec, sid, stid = null){
      var selection = selections[sid];
      
      
      var styleSpec = {
        spec : spec,
        hidden : false
      }
      
      var id = null; 
      
      if(stid == null) {
        id = makeid(4);
        selection.styles[id] = styleSpec
      }
      else {
        id = stid;
        selection.styles[id].spec = spec;
      }
      
      console.log("StateManager::addStyle", selections, sid, stid, spec);
      render();

      return id;
    }

    
    /**
     * Removes the style specified by stid
     * 
     * @function $3Dmol.StateManager#removeStyle 
     * @param {String} sid Selection id
     * @param {String} stid Style Id
     */
    this.removeStyle = function(sid, stid){
      console.log(selections, stid, sid)
      delete selections[sid].styles[stid];
      render();
    }


    /**
     * Toggle hidden property of a style 
     * 
     * @function $3Dmol.StateManager#toggleHideStyle
     * @param {String} sid Selection Id
     * @param {String} stid Style Id 
     */
    this.toggleHideStyle = function(sid, stid){
      selections[sid].styles[stid].hidden = !selections[sid].styles[stid].hidden;
      render();
    }

    /**
     * Adds surface to the viewport
     * 
     * @function $3Dmol.StateManager#addSurface
     * @param {Object} property Surface output object
     * @param {Function} callback callback
     * @returns String
     */
    this.addSurface = function(property, callback){
      var id = makeid(4);
      property.id = id;

      var style = property.surfaceStyle.value;
      if(style == null)
        style = {};

      var sel = selections[property.surfaceFor.value];

      var generatorAtom = (property.surfaceOf.value == 'self')? sel.spec : {};

      console.log('StateManager::addSurface', property, style);

      glviewer.addSurface(
        $3Dmol.SurfaceType[property.surfaceType.value],
        style,
        sel.spec,
        generatorAtom
      ).then((surfId)=>{
        surfaces[id] = surfId;
        console.log("StateManager::Surfaces", surfaces);
        callback(id, surfId);
      }, (err)=>{
        console.log('It failed', err);
      });

      return id;
    }

    /**
     * Removes surface from the viewport 
     * @function $3Dmol.StateManager#removeSurface
     * @param {String} id Surface Id
     */
    this.removeSurface = function(id){
      
      glviewer.removeSurface(surfaces[id])
      delete surfaces[id];

    }

    /**
     * Edit the exisiting surface in the viewport
     * 
     * @function $3Dmol.StateManager#editSurface
     * @param {Object} surfaceProperty Surface Style
     */
    this.editSurface = function(surfaceProperty){
      var style = surfaceProperty.surfaceStyle.value || {}
      var sel = selections[surfaceProperty.surfaceFor.value];

      console.log('Surfaces edited', surfaceProperty.id, surfaces, surfaces[surfaceProperty.id]);
      glviewer.removeSurface(surfaces[surfaceProperty.id]);

      glviewer.addSurface(
        $3Dmol.SurfaceType[surfaceProperty.surfaceType.value],
        style,
        sel.spec
      ).then((surfId)=>{
        surfaces[surfaceProperty.id] = surfId;
      });

      console.log('StateManager::editSurface#Updating Surface', surfaceProperty)
    }

    /**
     * Returns the list of ids of selections that are created so far
     * @function $3Dmol.StateManager#getSelectionList
     * @returns <Array of selection ids>
     */
    this.getSelectionList = function(){
      console.log(Object.keys(selections))
      return Object.keys(selections);
    }

    /**
     * Opens context menu when called from glviewer
     * 
     * @function $3Dmol.StateManager#openContextMenu
     * @param {AtomSpec} atom Atom spec obtained from context menu event
     * @param {Number} x x coordinate of mouse on viewport
     * @param {Number} y y coordinate of mouse on the viewport
     */
    this.openContextMenu = function(atom, x, y){
      console.log('Open Context Menu', atom, x, y);  
      var atomExist = false;

      if(atom){
        atomExist = Object.keys(atomLabel).find((i)=>{
          if (i == atom.index)
            return true;
          else 
            return false;
        });
  
        if(atomExist != undefined )
          atomExist = true;
        else 
          atomExist = false;
        
      }

      this.ui.tools.contextMenu.show(x, y, atom, atomExist);    
    }

    /**
     * Adds Label to the viewport specific to the selection
     * @function $3Dmol.StateManager#addLabel
     * @param {Object} labelValue Output object from label form of Context Menu
     */
    this.addLabel = function(labelValue){
      console.log('Label Added', labelValue);
      labels[labelValue.sel.value] = labels[labelValue.sel.value] || [];

      var labelProp = $3Dmol.labelStyles[labelValue.style.value];
      var selection = selections[labelValue.sel.value];

      var offset = labels[labelValue.sel.value].length;
      labelProp['screenOffset'] = new $3Dmol.Vector2(0, -1*offset*35);

      labels[labelValue.sel.value].push(glviewer.addLabel(labelValue.text.value, labelProp, selection.spec));

      this.ui.tools.contextMenu.hide();
    }

    /**
     * Adds atom label to the viewport
     * 
     * @function $3Dmol.StateManager#addAtomLabel
     * @param {Object} labelValue Output object from propertyMenu form of Context Menu
     * @param {AtomSpec} atom Atom spec that are to be added in the label 
     */
    this.addAtomLabel = function(labelValue, atom){
      var atomExist = Object.keys(atomLabel).find((i)=>{
        if (i == atom.index)
          return true;
        else 
          return false;
      });

      if(atomExist != undefined )
        atomExist = true;
      else 
        atomExist = false;


      if(atomExist){
        this.removeAtomLabel(atom);
      }

      console.log('Add Atom Label Value', labelValue);
      
      atomLabel[atom.index] = atomLabel[atom.index] || null;
      
      var labelProp = $3Dmol.deepCopy($3Dmol.labelStyles['milk']);
      labelProp.position = {
        x : atom.x, y : atom.y, z : atom.z
      }

      var labelText = [];
      for ( key in labelValue){
        labelText.push(`${key} : ${labelValue[key]}`);
      }
      labelText = labelText.join('\n');

      atomLabel[atom.index] = glviewer.addLabel(labelText, labelProp);
      
      console.log('Getting Atom Label', labelText, labelProp);
    }

    /**
     * Executes hide context menu and process the label if needed
     * 
     * @function $3Dmol.StateManager#exitContextMenu
     * @param {Boolean} processContextMenu Specify the need to process the values in the context menu
     */
    this.exitContextMenu = function(processContextMenu = false){
      console.log('Unfinished Labeling');
      this.ui.tools.contextMenu.hide(processContextMenu);
    }

    /**
     * Removes the label specific to the selection 
     * 
     * (under development)
     */
    this.removeLabel = function(){
      // Add code to remove label 
      console.log('Remove Label')
      this.ui.tools.contextMenu.hide();
    }

    /**
     * Removes the atom label from the viewpoer 
     * @function $3Dmol.StateManager#removeAtomLabel
     * @param {AtomSpec} atom Atom spec
     */
    this.removeAtomLabel = function(atom){
      var label = atomLabel[atom.index];
      console.log("Stuff", label, atomLabel);
      glviewer.removeLabel(label);
      delete atomLabel[atom.index]; 
      
      console.log("Stuff After removal", label, atomLabel);
      this.ui.tools.contextMenu.hide();
    }

    /**
     * Add model to the viewport
     * @function $3Dmol.StateManager#addModel
     * @param {Object} modelDesc Model Toolbar output
     */
    this.addModel = function(modelDesc){
      glviewer.removeAllModels();
      glviewer.removeAllSurfaces();
      glviewer.removeAllLabels();
      glviewer.removeAllShapes();

      var query = modelDesc.urlType.value + ':' + modelDesc.url.value;
      $3Dmol.download(query, glviewer, {}, ()=>{
        this.ui.tools.modelToolBar.setModel(modelDesc.url.value.toUpperCase());
      });

      // Remove all Selections
      selections = {};
      surfaces = {};
      atomLabel = {};
      labels = {};

      // Reset UI
      this.ui.tools.selectionBox.empty();
      this.ui.tools.surfaceMenu.empty();
    }

    // State Management helper function 
    function findSelectionBySpec(spec){
      var ids = Object.keys(selections);
      var matchingObjectIds = null;
      for(var i = 0; i < ids.length; i++){
        var lookSelection = selections[ids[i]].spec;

        var match = true;
        
        // looking for same parameters length 
        var parameters = Object.keys(spec);
        if( Object.keys(lookSelection).length == parameters.length){
          for(var j = 0; j < parameters.length; j++){
            if( lookSelection[parameters[j]] != spec[parameters[j]]){
              match = false;
              break;
            }
          }
        }

        if(match){
          matchingObjectIds = ids[i];
          break;
        }
      }

      return matchingObjectIds;
    }

    // State managment function 

    /**
     * Updates the state variable for selections and styles and trigger ui to show the 
     * ui elements for these selections and styles.
     * 
     * @function $3Dmol.StateManager#createSelectionAndStyle
     * @param {AtomSelectionSpec} selSpec Atom Selection Spec
     * @param {AtomStyleSpec} styleSpec Atom Style Spec
     */
    this.createSelectionAndStyle = function(selSpec, styleSpec){

      var selId = findSelectionBySpec(selSpec);


      if(selId == null){
        selId = this.addSelection(selSpec);
        
      }

      var styleId = null;

      if(Object.keys(styleSpec).length != 0){
        styleId = this.addStyle(styleSpec, selId);
      }

      this.ui.tools.selectionBox.editSelection(selId, selSpec, styleId, styleSpec);
      
      console.log('StateManager::Creating Selection and Style', selId, styleId, selections);
 
    };

    /**
     * Creates selection and add surface with reference to that selection 
     * and triggers updates in the ui
     * @function $3Dmol.StateManager#createSurface
     * @param {String} surfaceType Type of surface to be created
     * @param {AtomSelectionSpec} sel Atom selection spec
     * @param {AtomStyleSpec} style Atom style spec
     * @param {String} sid selection id
     */
    this.createSurface = function(surfaceType, sel, style, sid){
      var selId = findSelectionBySpec(sel);
      
      if(selId == null){
        selId = this.addSelection(selSpec);

      }
      this.ui.tools.selectionBox.editSelection(selId, sel, null);

      var surfaceType = Object.keys(style)[0];

      var surfaceInput = {
        surfaceType : {
          value : surfaceType
        },

        surfaceStyle : {
          value : style[surfaceType],
        },

        surfaceOf : {
          value : 'self'
        },

        surfaceFor : {
          value : selId
        }
      }

      var surfId = makeid(4);
      surfaces[surfId] = sid;

      this.ui.tools.surfaceMenu.addSurface(surfId, surfaceInput);

      // this.addSurface(surfaceInput, (id, sfid)=>{
      //   console.log('StateManager::Creating Surface', style, id, sfid, selId, surfaces);
      // });


      // Create Surface UI
    };

    /**
     * Sets the value of title in ModelToolBar
     * @function $3Dmol.StateManager#setModelTitle
     * @param {String} title Model title
     */
    this.setModelTitle = function(title){
      this.ui.tools.modelToolBar.setModel(title);
    }

    canvas.on('click', ()=>{
      if(this.ui.tools.contextMenu.hidden == false){
        this.ui.tools.contextMenu.hide();
      }
    });
    
    // Setting up UI generation 
    /**
     * Generates the ui and returns its reference
     * @returns $3Dmol.UI
     */
    this.showUI = function(){
      var ui = new $3Dmol.UI(this, uiOverlayConfig, parentElement);  
      return ui;
    };

    if(config.ui == true){
     this.ui = this.showUI(); 
    };

    /**
     * Updates the UI on viewport change 
     * 
     * @function $3Dmol.StateManager#updateUI
     */
    this.updateUI = function(){
      if(this.ui){
        this.ui.resize();
      }
    };
    
    // UI changes

    // console.log('GetSelectionList', this.getSelectionList());

    function render(){
      console.log('RENDER::', selections);
      // glviewer.();
      glviewer.setStyle({});

      let selList = Object.keys(selections);

      selList.forEach( (selKey) =>{
        var sel = selections[selKey];

        if( !sel.hidden ) {
          var styleList = Object.keys(sel.styles);
          
          styleList.forEach((styleKey)=>{
            var style = sel.styles[styleKey];

            if( !style.hidden){
              glviewer.addStyle(sel.spec, style.spec);
            }
          });

          glviewer.setClickable(sel.spec, true, ()=>{});
          glviewer.enableContextMenu(sel.spec, true);
        }
        else {
          glviewer.setClickable(sel.spec, false, ()=>{});
          glviewer.enableContextMenu(sel.spec, false);
        }

      })

      glviewer.render();
    }

    function makeid(length) {
      var result           = '';
      var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
     }
     return result;
    }
  }

  return States;
})()
