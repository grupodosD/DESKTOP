const { app, BrowserWindow } = require('electron');
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

// Configuração do Express
const expressApp = express();
expressApp.use(express.json());
expressApp.use(express.static(__dirname)); // Servir arquivos estáticos da raiz
const port = 3000; // Porta para o servidor Express

// Configuração da conexão com o MySQL
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'HotelM'
};

// Rota para autenticação de login
expressApp.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  console.log('Recebido pedido de login para:', email);

  try {
    const connection = await mysql.createConnection(dbConfig);
    const chaveSecreta = '526F79616c506c616365000000000000';
    const [rows] = await connection.execute('SELECT * FROM funcionario WHERE Nome = ? AND AES_DECRYPT(Senha, UNHEX(?)) = ?', [email, chaveSecreta, senha]);
    await connection.end();

    if (rows.length > 0) {
        console.log('Login bem-sucedido para:', email);
        res.json({ success: true, message: 'Login bem-sucedido' });
      } else {
        console.log('Login falhou para:', email);
        res.json({ success: false, message: 'Usuário ou senha incorretos' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erro ao autenticar usuário' });
    }
  });
  
  // Iniciar o servidor Express
  expressApp.listen(port, () => {
    console.log(`Servidor Express rodando na porta ${port}`);
  });



  expressApp.get('/quartos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT 
                Quarto.Id_Quarto, 
                Tipos_Quartos.Suite AS Nome_do_Quarto, 
                Quarto.Status_Quartos, 
                Cliente.Nome AS Nome_Cliente
            FROM 
                Quarto
            JOIN 
                Tipos_Quartos ON Quarto.Id_TipoQuarto = Tipos_Quartos.Id_TipoQuarto
            LEFT JOIN 
                Reserva ON Quarto.Id_Reserva = Reserva.Id_Reserva
            LEFT JOIN 
                Cliente ON Reserva.Id_Cliente = Cliente.Id_Cliente
        `);
        await connection.end();


        res.json(rows); // Enviar os dados dos quartos como resposta JSON
    } catch (error) {
        console.error('Erro ao buscar quartos:', error);
        res.status(500).json({ message: 'Erro ao buscar quartos' });
    }
});


expressApp.get('/reservas', async (req, res) => {
  try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(`
          SELECT 
              Reserva.Id_Reserva, 
              Reserva.Data_Checkin, 
              Reserva.Data_Checkout, 
              Reserva.Status_Reserva, 
              Cliente.Nome AS Nome_Cliente
          FROM 
              Reserva
          JOIN 
              Cliente ON Reserva.Id_Cliente = Cliente.Id_Cliente
      `);
      await connection.end();
      res.json(rows);
  } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      res.status(500).json({ message: 'Erro ao buscar reservas' });
  }
});

      

expressApp.put('/reservas/:id', async (req, res) => {
  const reservaId = req.params.id; // ID da reserva que será atualizada
  const { checkin, checkout, status } = req.body; // Dados recebidos para atualização

  // Validação dos dados
  if (!checkin || !checkout || !status) {
      return res.status(400).json({ success: false, message: 'Todos os campos devem ser preenchidos.' });
  }

  try {
      const connection = await mysql.createConnection(dbConfig);

      // Usar a função DATE() do MySQL para garantir que só a data seja atualizada
      const [result] = await connection.execute(`
          UPDATE Reserva SET 
              Data_Checkin = DATE(?),  -- Garante que só a data será salva
              Data_Checkout = DATE(?),  -- Garante que só a data será salva
              Status_Reserva = ? 
          WHERE Id_Reserva = ?`, 
          [checkin, checkout, status, reservaId]
      );

      await connection.end();

      if (result.affectedRows > 0) {
          res.json({ success: true, message: 'Reserva atualizada com sucesso.' });
      } else {
          res.status(404).json({ success: false, message: 'Reserva não encontrada.' });
      }
  } catch (error) {
      console.error('Erro ao atualizar reserva:', error);
      res.status(500).json({ success: false, message: 'Erro ao atualizar reserva.' });
  }
});



// Rota para deletar uma reserva
expressApp.delete('/reservas/:id', async (req, res) => {
  const reservaId = req.params.id; // O ID da reserva a ser deletada

  try {
      const connection = await mysql.createConnection(dbConfig);
      
      // Deletar os quartos associados à reserva
      await connection.execute(`
          DELETE FROM Quarto 
          WHERE Id_Reserva = ?`, 
          [reservaId]);

      // Agora, deletar a reserva
      const [result] = await connection.execute(`
          DELETE FROM Reserva 
          WHERE Id_Reserva = ?`, 
          [reservaId]);

      await connection.end();

      if (result.affectedRows > 0) {
          res.json({ success: true, message: 'Reserva deletada com sucesso.' });
      } else {
          res.status(404).json({ success: false, message: 'Reserva não encontrada.' });
      }
  } catch (error) {
      console.error('Erro ao deletar reserva:', error);
      res.status(500).json({ success: false, message: 'Erro ao deletar reserva.' });
  }
});

  // Função para carregar a janela principal
  function carregar_janela() {
    const mainWindow = new BrowserWindow({
      width: 1000,
      height: 800, // Ajustar a altura da janela
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });
  
    mainWindow.loadFile(path.join(__dirname, 'index.html')); // Corrigido o caminho
    // mainWindow.webContents.openDevTools(); // Comentado para não abrir as ferramentas de desenvolvedor
  }
  
  app.on('ready', carregar_janela);
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      carregar_janela();
    }
  });
  
