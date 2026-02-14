import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('documentacao')
export class DocumentacaoController {
  @Get()
  getDocumentacao(@Res() res: Response) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📱 Sistema de Registro de Gastos - Documentação</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
            padding: 40px 0;
        }

        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .content {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .section {
            padding: 40px;
            border-bottom: 1px solid #ecf0f1;
        }

        .section:last-child {
            border-bottom: none;
        }

        .section h2 {
            color: #2c3e50;
            font-size: 2em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #3498db;
        }

        .section h3 {
            color: #34495e;
            font-size: 1.5em;
            margin: 30px 0 15px 0;
        }

        .section h4 {
            color: #7f8c8d;
            font-size: 1.2em;
            margin: 20px 0 10px 0;
        }

        .code-block {
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
            overflow-x: auto;
        }

        .example {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #27ae60;
        }

        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }

        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .table th,
        .table td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #ecf0f1;
        }

        .table th {
            background: #3498db;
            color: white;
            font-weight: 600;
        }

        .table tr:nth-child(even) {
            background: #f8f9fa;
        }

        .table tr:hover {
            background: #e8f4fd;
        }

        .emoji {
            font-size: 1.2em;
            margin-right: 8px;
        }

        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }

        .feature-item {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }

        .feature-item h4 {
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .footer {
            text-align: center;
            padding: 40px;
            background: #2c3e50;
            color: white;
        }

        .footer p {
            margin-bottom: 10px;
        }

        .footer a {
            color: #3498db;
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }

            .header h1 {
                font-size: 2em;
            }

            .section {
                padding: 20px;
            }

            .feature-list {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📱 Sistema de Registro de Gastos</h1>
            <p>Sistema profissional de controle financeiro via Telegram Bot com integração ao Google Sheets</p>
        </div>

        <div class="content">
            <section id="apresentacao" class="section">
                <h2>🎯 Apresentação</h2>
                <p>O sistema oferece uma solução completa para registro e controle de gastos pessoais através do Telegram, com armazenamento automático no Google Sheets.</p>

                <h3>Principais Características</h3>
                <div class="feature-list">
                    <div class="feature-item">
                        <h4>✅ Registro Rápido</h4>
                        <p>Duas formas de registrar gastos (mensagem direta ou menu interativo)</p>
                    </div>
                    <div class="feature-item">
                        <h4>✅ Categorização Flexível</h4>
                        <p>Categorias e formas de pagamento personalizáveis</p>
                    </div>
                    <div class="feature-item">
                        <h4>✅ Relatórios Inteligentes</h4>
                        <p>Relatórios automáticos baseados em período configurável</p>
                    </div>
                    <div class="feature-item">
                        <h4>✅ Resumos Diários</h4>
                        <p>Notificações automáticas todos os dias</p>
                    </div>
                    <div class="feature-item">
                        <h4>✅ Persistência Segura</h4>
                        <p>Todos os dados salvos no Google Sheets</p>
                    </div>
                    <div class="feature-item">
                        <h4>✅ Autenticação Robusta</h4>
                        <p>Controle de acesso por User ID do Telegram</p>
                    </div>
                </div>
            </section>

            <section id="funcionalidades" class="section">
                <h2>💰 Funcionalidades</h2>

                <h3>1. Registro de Gastos</h3>

                <h4>Mensagem Direta (Formato Rápido)</h4>
                <p>Registre gastos enviando uma mensagem no formato simples:</p>
                <div class="code-block">
[forma_pagamento], [valor], [tipo], [observação]
                </div>

                <h4>Exemplos Práticos:</h4>
                <div class="example">
cartão nubank, 35, moradia, almoço no centro<br>
pix, 50.50, vestuario, uber<br>
dinheiro, 20, outros<br>
cartão nubank, 150, moradia, consulta médica
                </div>

                <h4>Fluxo Interativo (Modo Guiado)</h4>
                <p>Comando: <code>/criar</code></p>
                <p>O bot guia você através de um processo passo a passo com teclado personalizado.</p>

                <h3>2. Gerenciamento de Categorias</h3>
                <p>Sistema completo para gerenciar suas categorias de gastos.</p>

                <h4>Comandos Disponíveis:</h4>
                <ul>
                    <li><code>/categorias</code> - Listar todas as categorias</li>
                    <li><code>/addcategoria [nome]</code> - Adicionar nova categoria</li>
                    <li><code>/delcategoria [número]</code> - Remover categoria</li>
                </ul>

                <h3>3. Gerenciamento de Formas de Pagamento</h3>
                <p>Gerencie suas formas de pagamento personalizadas.</p>

                <h4>Comandos Disponíveis:</h4>
                <ul>
                    <li><code>/formas</code> - Listar todas as formas</li>
                    <li><code>/addforma [nome]</code> - Adicionar nova forma</li>
                    <li><code>/delforma [número]</code> - Remover forma</li>
                </ul>

                <h3>4. Relatórios e Consultas</h3>

                <h4>Relatório Completo</h4>
                <p><strong>Comando:</strong> <code>/relatorio</code></p>
                <p>Gera um relatório detalhado baseado no período configurado.</p>

                <h3>5. Configurações do Sistema</h3>

                <h4>Configurar Dia de Início do Mês</h4>
                <p><strong>Comando:</strong> <code>/config</code></p>
                <p>Define qual dia do mês deve ser considerado como início do seu "mês financeiro".</p>

                <h3>6. Resumos Automáticos</h3>
                <p>O sistema envia automaticamente um resumo diário às <strong>21:00</strong> (horário do servidor).</p>

                <h3>7. Comandos Disponíveis</h3>

                <h4>Comandos Principais</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Comando</th>
                            <th>Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td><code>/menu</code></td><td>Exibe menu principal</td></tr>
                        <tr><td><code>/ajuda</code></td><td>Mostra instruções detalhadas</td></tr>
                        <tr><td><code>/documentacao</code></td><td>Acessar documentação web</td></tr>
                        <tr><td><code>/criar</code></td><td>Inicia fluxo interativo</td></tr>
                        <tr><td><code>/cancelar</code></td><td>Cancela operação atual</td></tr>
                    </tbody>
                </table>

                <h4>Comandos de Consulta</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Comando</th>
                            <th>Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td><code>/relatorio</code></td><td>Gera relatório de gastos</td></tr>
                        <tr><td><code>/categorias</code></td><td>Lista categorias</td></tr>
                        <tr><td><code>/formas</code></td><td>Lista formas de pagamento</td></tr>
                    </tbody>
                </table>

                <h4>Comandos de Gerenciamento</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Comando</th>
                            <th>Exemplo</th>
                            <th>Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td><code>/addcategoria [nome]</code></td><td><code>/addcategoria saúde</code></td><td>Adiciona categoria</td></tr>
                        <tr><td><code>/delcategoria [número]</code></td><td><code>/delcategoria 2</code></td><td>Remove categoria</td></tr>
                        <tr><td><code>/addforma [nome]</code></td><td><code>/addforma débito</code></td><td>Adiciona forma</td></tr>
                        <tr><td><code>/delforma [número]</code></td><td><code>/delforma 3</code></td><td>Remove forma</td></tr>
                        <tr><td><code>/config</code></td><td><code>/config</code></td><td>Configura mês</td></tr>
                    </tbody>
                </table>
            </section>
        </div>

        <footer class="footer">
            <p><strong>Desenvolvido por <a href="https://github.com/joannegton" target="_blank" style="color: #3498db; text-decoration: none;">Joannegton</a></strong></p>
            <p>Sistema completo de controle financeiro pessoal via Telegram Bot</p>
        </footer>
    </div>
</body>
</html>`;
    res.header('Content-Type', 'text/html');
    res.send(html);
  }
}
