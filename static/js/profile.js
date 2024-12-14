Busbutton  = document.querySelector(".bus-buttons");

function replaceWal() {
    document.getElementById("divhis").style.display="none";
    document.getElementById("divwal").style.display="block";
}
function replaceHis() {
    document.getElementById("divwal").style.display = "none";
    document.getElementById("divhis").style.display = "block";
}
const SelectGraph = document.querySelectorAll("form select");

for (let i = 0; i < SelectGraph.length; i++) {
    for(let currency_code in country_list){
        let selected = i === 0 ? currency_code === "USD" ? "selected" : "" : currency_code === "PLN" ? "selected" : "";
        let optionTag = `<option value="${currency_code}" ${selected}>${currency_code}</option>`;
        SelectGraph[i].insertAdjacentHTML("beforeend", optionTag);
    }
    SelectGraph[i].addEventListener("change", e =>{
        loadFlag(e.target);
    });
}
function loadFlag(element){
    for(let code in country_list){
        if(code === element.value){
            let flagTag = element.parentElement.querySelector("span");
            flagTag.className = `fi fi-${country_list[code]}`;
        }
    }
}

Busbutton.addEventListener("click", e =>{
    buy();
});


function buy() {
    let content = $('#message-input').val();
    let code_1 = $('#UserSelect_1').val();
    let code_2 = $('#UserSelect_2').val();
    $.ajax({
        url: "/profile",
        type: "POST",
        data: JSON.stringify({
        'content': content,
        'code_1': code_1,
        'code_2': code_2,
        }),
        contentType: "application/json",
        success: function() {
        location.reload();
    }
    })
    .done(function (data){
        $('#message-input').val('1')
    })
    .fail(function (xhr, status, errorThrown) {
        alert("Transaction refused.")
    })
}

$('.slider-top').slick({
       slidesToShow: 1,
       slidesToScroll: 1,
       arrows: false,
       fade: true,
       asNavFor: '.slider-bottom'
});

 $('.slider-bottom').slick({
   slidesToShow: 3,
   slidesToScroll: 1,
   asNavFor: '.slider-top',
   dots: true,
   focusOnSelect: true,
 });

 $('a[data-slide]').click(function(e) {
   e.preventDefault();
   let slide = $(this).data('slide');
   $('.slider-bottom').slick('slickGoTo', slide - 1);
 });
