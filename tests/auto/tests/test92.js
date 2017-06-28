
$.get("volData/model1.prmtop",  function (data){
    var m = viewer.addModel(data, "prmtop");
    var url = "127.0.0.1:800/mdsrv";
    var pathToFile = "root/3Dmol.js/tests/auto/volData/md_1u19.xtc";
    m.setCoordinatesFromUrl(url,pathToFile);
    viewer.setStyle({},{sphere:{}});
    viewer.zoomTo();
    viewer.animate({loop:"forward",reps:1});
    viewer.render();
});
