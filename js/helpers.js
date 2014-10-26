window.levenstein = (function() {
            var row2 = [];
            return function(s1, s2) {
              if (s1 === s2) {
                return 0;
              } else {
                var s1_len = s1.length, s2_len = s2.length;
                if (s1_len && s2_len) {
                  var i1 = 0, i2 = 0, a, b, c, c2, row = row2;
                  while (i1 < s1_len)
                    row[i1] = ++i1;
                  while (i2 < s2_len) {
                    c2 = s2.charCodeAt(i2);
                    a = i2;
                    ++i2;
                    b = i2;
                    for (i1 = 0; i1 < s1_len; ++i1) {
                      c = a + (s1.charCodeAt(i1) !== c2 ? 1 : 0);
                      a = row[i1];
                      b = b < a ? (b < c ? b + 1 : c) : (a < c ? a + 1 : c);
                      row[i1] = b;
                    }
                  }
                  return b;
                } else {
                  return s1_len + s2_len;
                }
              }
            };
          })();

window.arrayUnique = function(array) {
  var a, i, j;
  a = array.concat();
  i = 0;
  while (i < a.length) {
    j = i + 1;
    while (j < a.length) {
      if (a[i] === a[j]) {
        a.splice(j--, 1);
      }
      ++j;
    }
    ++i;
  }
  return a;
};