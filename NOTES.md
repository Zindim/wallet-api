# 1 What each thing does and what is it

Wallet-api is the whole project

node_modules is the actual code of the libraries themselves, so if my app calls express() it can look into the node_modules and run what is specified for the function to do. There are type references in there too but the main thing is actual libraries that have executable code/functions.

src is my written stuff, will expand later once i start writing code inside there

.gitignore
 is a file that stores exeptions of what not to store in commit, like node_modules for example it can be replicated and downloaded from the internet, it doesnt need to be saved, because it can be easily replicated.

package-lock.json
- actually not that sure what it is, it locks in place the package.json but not sure how it does it

package.json
- is like the project's recipe card, it 
lists :
-the name/version,
-every library my project depends on and roughly which range of versions is acceptable
custom shortcut commands under "scripts" - this is where dev, build, start live, which is why npm run dev works.

anyone who clones this repo would run npm install and npm reads this file to know exactly what to download.

package-lock.json 
even thought package.json sqpicifies a range of versions at the end of the day there should be one concrete version, that version gets sert when you run npm and locked as a parameter so if anyone used the repo they would use the same version npm was first run on, even if theres a newer version. Using the newest isnt always the safest and if there a need for a newer version theresalways the option to bash update the np if needed.


