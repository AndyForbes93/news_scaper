$(document).ready(function(){
    console.log("frontend");
    $(".btn-danger").on("click" , function(){
        console.log("clicked"+ this.id);
        $("#" + this.id).addClass("d-none");
    });

});
