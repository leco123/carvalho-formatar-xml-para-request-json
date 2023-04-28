const vscode = require('vscode');
const xml2js = require('xml2js');
const translate = require('google-translate-api');

function formatXmlAndEscapeForJson(xml) {
    return new Promise((resolve, reject) => {
        const builder = new xml2js.Builder({ headless: true, renderOpts: { 'pretty': false } });

        xml2js.parseString(xml, async (err, result) => {
            if (err) {
                console.error("ERRO: parseString ---> ");
                console.error(err);
                const translatedErrorMessage = await translateText(err.message, 'pt');
                const translatedErrorname = await translateText(err.name, 'pt');
                vscode.window.showErrorMessage('Erro ao processar o XML: \n Nome erro: '+ translatedErrorname+' \n Mensagem do erro: ' + translatedErrorMessage);
                reject(err);
            } else {
                const formattedXml = builder.buildObject(result);
                const escapedXml = formattedXml.replace(/"/g, '\\"');
                const singleLineXml = escapedXml.replace(/(\r\n|\n|\r)/gm, '');
                resolve(singleLineXml);
            }
        });
    });
}

async function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.alexFormatXml', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Nenhum editor ativo');
            return;
        }

        const selection = editor.selection;
        const xml = editor.document.getText(selection);

        try {
            const formattedXml = await formatXmlAndEscapeForJson(xml);
            editor.edit(editBuilder => {
                editBuilder.replace(selection, formattedXml);
            });
        } catch (err) {
            vscode.window.showErrorMessage('Erro ao formatar o XML: ' + err.message);
        }
    });

    context.subscriptions.push(disposable);
}

async function translateText(text, targetLanguage) {
    try {
        const result = await translate(text, { to: targetLanguage });
        return result.text;
    } catch (error) {
        console.error('Erro ao traduzir o texto:', error);
        return text;
    }
}


function deactivate() {}

module.exports = {
    activate,
    deactivate
};
