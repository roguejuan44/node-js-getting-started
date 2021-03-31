function revealLocation() {
    var elems = document.querySelectorAll(".panels");

    [].forEach.call(elems, function(el) {
        el.classList.remove("open");
    });}

