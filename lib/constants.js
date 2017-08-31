// Copyright (c) 2015-present, salesforce.com, inc. All rights reserved
// Licensed under BSD 3-Clause - see LICENSE.txt or git.io/sfdc-license

module.exports = {
  ALIAS_PATTERN: /{!([^}]+)}/g,

  BOX_SHADOW_PATTERN: /(\d+)(?:px)? (\d+)(?:px)? (\d+)(?:px)? ((rgba\(.*\))|#\d{3,6})/g,

  PERCENTAGE_PATTERN: /(\d+)%/g
};
