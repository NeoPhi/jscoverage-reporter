rm -f -r build
mkdir build
jscoverage src build/src/
mkdir build/test/
cp -R test build/
npm test
