const urlUtils = {};

// Convenience function for parsing of URL parameters
// based on http://www.jquerybyexample.net/2012/06/get-url-parameters-using-jquery.html
function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1);

  var sURLVariables = sPageURL.split("&");
  // console.log("URl ----", sURLVariables);
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split("=");
    if (sParameterName[0] === sParam) {
      var res = sParameterName[1].replace(/\+/g, "%20");
      // console.log("inside  ----", res);
      return decodeURIComponent(res);
    }
  }
}

urlUtils.getUrlParameter = getUrlParameter;
export default urlUtils;
