import ts from 'typescript';
import {readFile,writeFile} from 'node:fs/promises';
const files=['src/ui/hud.ts','src/ui/goal.ts','../BurgerRush/src/definition.ts','../PizzaPiazza/src/definition.ts'];
const entries=new Map();
for(const file of files){const source=ts.createSourceFile(file,await readFile(file,'utf8'),ts.ScriptTarget.Latest,true);function visit(node){
 if(ts.isCallExpression(node)&&node.expression.getText(source)==='t'&&node.arguments.length===2&&node.arguments.every(ts.isStringLiteral)){entries.set(node.arguments[1].text,node.arguments[0].text);}
 if(ts.isObjectLiteralExpression(node)){let cs,en;for(const p of node.properties)if(ts.isPropertyAssignment(p)&&ts.isIdentifier(p.name)&&ts.isStringLiteral(p.initializer)){if(p.name.text==='cs')cs=p.initializer.text;if(p.name.text==='en')en=p.initializer.text;}if(cs&&en)entries.set(en,cs);}
 ts.forEachChild(node,visit);
}visit(source);}
console.log([...entries.keys()].map((x,i)=>`${i}: ${x}`).join('\n'));console.log('COUNT',entries.size);
await writeFile('src/ui/messages.json',JSON.stringify(Object.fromEntries(entries),null,2)+'\n');
