var fs = require('fs');

var myData = {
  name:'test',
  version:'1.0'
}

var outputFilename = 'test.json';

fs.writeFile(outputFilename, JSON.stringify(myData, null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + outputFilename);
    }
}); 