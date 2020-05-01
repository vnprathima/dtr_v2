import GenericUi from "./GenericUi.js";
// import CernerUi from "./CernerUi.js";

export default class UiFactory{
    constructor(props) {

    }

    getUi() {
        if(sessionStorage.hasOwnProperty("UI_TYPE")) {
             var ui_type = sessionStorage["UI_TYPE"];
             if (ui_type === "cerner_ui") {
                // return new CernerUi();
                
             }
        }
        return new GenericUi();
    }
}