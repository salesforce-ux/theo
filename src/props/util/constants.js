module.exports = {

  ALIAS_PATTERN: /\{\!([^}]+)\}/g,
  
  BOX_SHADOW_PATTERN: /(\d+)(?:px)? (\d+)(?:px)? (\d+)(?:px)? ((rgba\(.*\))|#\d{3,6})/g,
  
  PERCENTAGE_PATTERN: /(\d+)%/g,

};