CurrencySelect = document.querySelector(".select-box select");
loadButton = document.querySelector(".select-box .load-btn");

for(let currency_code in country_list){
    let selected =  currency_code === "PLN" ? "selected" : "";
    let optionTag = `<option value="${currency_code}" ${selected}>${currency_code}</option>`;
    CurrencySelect.insertAdjacentHTML("beforeend", optionTag);
}
CurrencySelect.addEventListener("change", e =>{
    loadFlag(e.target);
});

function loadFlag(element){
    for(let code in country_list){
        if(code === element.value){
            let flagTag = element.parentElement.querySelector("span");
            flagTag.className = `fi fi-${country_list[code]}`;
        }
    }
}

window.addEventListener("load", ()=>{
    loadTable();
});

loadButton.addEventListener("click", event =>{
    event.preventDefault();
    loadTable();
});

function loadTable(){
    const secondColumnTxt = document.querySelector(".rates .second-col");
    const TableTxt = document.querySelector(".rates tbody");

    secondColumnTxt.innerText = `1.00 ${CurrencySelect.value} =`
    if (TableTxt !== ""){
                TableTxt.innerHTML = ""
    }

    let url_table = `https://api.frankfurter.app/latest?from=${CurrencySelect.value}`
    fetch(url_table)
        .then(response => response.json())
        .then(data =>{

            for(let code in country_list) {
                if(code !== CurrencySelect.value){
                    let trcurrency = `<tr>
                                        <td><span class="fi fi-${country_list[code]}"></span> ${code}</td>
                                        <td><p>${parseFloat(data.rates[code]).toFixed(3)}</p></td>
                                      </tr>`
                    TableTxt.insertAdjacentHTML("beforeend", trcurrency);
                }
            }
        })
}