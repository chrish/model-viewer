var file="rawfile.txt";
data = {}
rawData=[]

//Configure column default values
var C_SRC_NAME = 0;
var C_SRC_SRC = 3;
var C_CONTEXT = 6;
var C_STR_PATH = 7;
var C_STR_ALIAS = 8;
var C_SEPARATOR = ".";
var C_ENABLE_CONTEXT = true;

function getConfigItem(itemId){
    var el = document.getElementById(itemId).value;
}

function getLastModDate(){
    fetch("js/date.json") 
    .then(data=> data.json())
    .then(parsedData => {
        console.log("Date set");
        document.getElementById("lastMod").innerHTML="<h5>Last modified:</h5>" + parsedData.date;
        return parsedData.date;
    })
    .catch(function() {
        console.log("Error fetching date.json...");
    });
}

// Add entity if parent has more than one in the path. 
// If parent has one entity, add attribute as value 
function checkPathForMember(dataset, parentPath, itemAttribute, attributeMeta){
   // Add item to structure
    if (parentPath.length == 1){
        //console.log("adding " + itemAttribute);
        //console.log(attributeMeta);
        if (!dataset.hasOwnProperty(parentPath)){
           //console.log("Adding new entry to tree");
            dataset[parentPath] = {"name": itemAttribute, "refs": []}
        }
        
        try{
            dataset[parentPath]["refs"].push(attributeMeta);
        }catch (error){
            console.log("An error occurred when pushing a new attribute with the same name as an existing entity.");
            console.log("This typically happens if an attribute (Field.Ownership) refers to a path used by an existing entity (Field.Ownership.Equity)");
            console.log("Attempted to add " + itemAttribute + "(" + parentPath + ")");
            console.log("On top of the following ");
            console.log(dataset[parentPath]); 
        }
   } else {
       // Not arrived at correct path yet, call self 
       // until we do and add parents as needed
        var firstElem = parentPath.shift();

        if (dataset.hasOwnProperty(firstElem)){
            dataset = dataset[firstElem];
            checkPathForMember(dataset, parentPath, itemAttribute, attributeMeta);
        } else {
            dataset[firstElem] = {}
            dataset = sortObject(dataset);
            checkPathForMember(dataset[firstElem], parentPath, itemAttribute,attributeMeta);
        }
    }
}

function objToHtmlList(obj) {
    if (!obj.hasOwnProperty("refs")){
        //entity; add ul and then call self 
        var ul = document.createElement('ul');
        obj = sortObject(obj);

        var attributes = [];

        // child is only the keyname, not the child object!
        for (var child in obj) {

            var li = document.createElement('li');
            var liClass = "node";
            if (!obj[child].hasOwnProperty("refs")){
                liClass="entity";
            }
            li.classList.add(liClass);
            li.classList.add("collapsibleListClosed");

            // Check if child has subnodes
            if (liClass == "entity"){
                li.appendChild(document.createTextNode(child + " (" + Object.keys(obj[child]).length + ")"));
            } else {
                li.appendChild(document.createTextNode(obj[child].name + " (" + Object.keys(obj[child].refs).length + ")"));
            }
            
            // Add any subnodes
            li.appendChild(objToHtmlList(obj[child]));
            
            // Sorting pt 1, add entities
            if (liClass == "entity"){
                ul.appendChild(li);
            } else {
                attributes.push(li);
            }
        }

        // Sorting pt 2, add attributes
        for (var a in attributes){
            ul.appendChild(attributes[a]);
        }
        return ul;
    }else {
        //attribute; add refs
        var ul = document.createElement('ul');
        for (var ref in obj.refs) {

            var li = document.createElement('li');
            li.classList.add("nodeRef");

            // Add any subnodes
            li.appendChild(document.createTextNode(obj.refs[ref].src + " (srcAttribute: " + obj.refs[ref].srcName + ")"));
            ul.appendChild(li);
        }

        return ul;
    }
}


function renderStructure(){
    data = {}
    rawData.forEach(element => {
        var kp = element.split('\t');

        // Field indexes are zero-indexed; correct this
        if (document.getElementById("srcName").checkValidity()){
            C_SRC_NAME = document.getElementById("srcName").value-1;
        }
        if (document.getElementById("srcSrc").checkValidity()){
            C_SRC_SRC = document.getElementById("srcSrc").value-1;
        }
        if (document.getElementById("strPath").checkValidity()){
            C_STR_PATH = document.getElementById("strPath").value-1;
        }
        if (document.getElementById("strAlias").checkValidity()){
            C_STR_ALIAS = document.getElementById("strAlias").value-1;
        }
        if (document.getElementById("strAlias").checkValidity()){
            C_CONTEXT = document.getElementById("context").value-1;
        }
        if (document.getElementById("separator").checkValidity()){
            C_SEPARATOR = document.getElementById("separator").value;
        }

        C_ENABLE_CONTEXT = document.getElementById("enableContext").checked;

        // For each row, split and generate object
        if (kp.length > 8){
            var src_name = kp[C_SRC_NAME];
            var src_src = kp[C_SRC_SRC];
            var str_path = kp[C_STR_PATH];
            var str_alias = kp[C_STR_ALIAS];
            var context = kp[C_CONTEXT];
            
            var srcInfo = {"src": src_src, "srcName": src_name}

            var kkp = str_alias.split(C_SEPARATOR);
            
            var path = (str_path+"."+kkp[1]);
            if (C_ENABLE_CONTEXT){
                path = (context + "." + str_path+"."+kkp[1]);
            }

            path=path.split(C_SEPARATOR);
            
            checkPathForMember(data, path, str_alias, srcInfo);
        }
    });

    data = sortObject(data);

    var lst = objToHtmlList(data);
    //lst.classList.add("collapsibleList");

    document.getElementById('contents').innerHTML = "";
    document.getElementById('contents').appendChild(lst);
    console.log(data);
}

function grabRawData(contents) {
    
    contents.split('\r\n').forEach(element => {
        rawData.push(element);
    });

    renderStructure();
  }
  function clickElem(elem) {
      var eventMouse = document.createEvent("MouseEvents")
      eventMouse.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
      elem.dispatchEvent(eventMouse)
  }
  function openFile(func) {
      readFile = function(e) {
          var file = e.target.files[0];
          //console.log(file);
          if (!file) {
              return;
          }
          var reader = new FileReader();
          reader.onload = function(e) {
              var contents = e.target.result;
              fileInput.func(contents)
              document.body.removeChild(fileInput)
          }
          reader.readAsText(file)          
      }
      fileInput = document.createElement("input")
      fileInput.type='file'
      fileInput.style.display='none'
      fileInput.onchange=readFile
      fileInput.func=func
      document.body.appendChild(fileInput)
      
      clickElem(fileInput)
  }

  function sortObject(o) {
    var sorted = {},
    key, a = [];

    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }

    a.sort();

    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
}

// Listestuff

document.addEventListener('click', function (event) {
	if (!event.target.matches('li')) return;

    console.log(event.target);

    if (event.target.classList.contains("collapsibleListOpen")){
        console.log("Open, closing");
        event.target.classList.remove('collapsibleListOpen');
        event.target.classList.add('collapsibleListClosed');
    } else {
        console.log("Closed, opening");
        event.target.classList.remove('collapsibleListClosed');
        event.target.classList.add('collapsibleListOpen');
    }
}, false);

document.getElementById("help").addEventListener(
  "click", 
  function(){ 
    document.getElementById("helpText").classList.toggle('help--show')
  }, 
  false
);

document.getElementById("enableContext").addEventListener(
    "click",
    function(){
        renderStructure();
    },
    false
);

getLastModDate();