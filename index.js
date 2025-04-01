#!/usr/bin/env node

const readlineSync = require('readline-sync');
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

// ゲームの状態
const gameState = {
  board: [
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' ']
  ],
  currentPlayer: 'O', // 'O'または'X'
  gameMode: null, // 'single'または'multi'
  gameOver: false,
  winner: null
};

// ゲームの開始
function startGame() {
  clear();
  console.log(
    chalk.yellow(
      figlet.textSync('〇×ゲーム', { horizontalLayout: 'full' })
    )
  );
  console.log(chalk.blue('三目並べへようこそ！'));
  console.log('------------------------------');
  
  // ゲームモードの選択
  const options = ['1人プレイ（対CPU）', '2人プレイ'];
  const index = readlineSync.keyInSelect(options, 'プレイモードを選択してください:');
  
  if (index === -1) {
    console.log(chalk.red('ゲームを終了します。'));
    process.exit();
  }
  
  gameState.gameMode = index === 0 ? 'single' : 'multi';
  
  // 先攻・後攻の選択（1人プレイの場合のみ）
  if (gameState.gameMode === 'single') {
    const playerOptions = ['先攻（O）', '後攻（X）'];
    const playerIndex = readlineSync.keyInSelect(playerOptions, '先攻・後攻を選択してください:');
    
    if (playerIndex === -1) {
      console.log(chalk.red('ゲームを終了します。'));
      process.exit();
    }
    
    gameState.currentPlayer = playerIndex === 0 ? 'O' : 'X';
    
    // プレイヤーが後攻の場合、CPUが先に打つ
    if (gameState.currentPlayer === 'X') {
      cpuMove();
      gameState.currentPlayer = 'X';
    }
  }
  
  gameLoop();
}

// ゲームのメインループ
function gameLoop() {
  while (!gameState.gameOver) {
    renderBoard();
    
    if (gameState.gameMode === 'single' && gameState.currentPlayer === 'O') {
      playerMove();
      checkGameStatus();
      if (gameState.gameOver) break;
      gameState.currentPlayer = 'X';
      cpuMove();
      checkGameStatus();
      gameState.currentPlayer = 'O';
    } else if (gameState.gameMode === 'single' && gameState.currentPlayer === 'X') {
      playerMove();
      checkGameStatus();
      if (gameState.gameOver) break;
      gameState.currentPlayer = 'O';
      cpuMove();
      checkGameStatus();
      gameState.currentPlayer = 'X';
    } else { // 2人プレイの場合
      console.log(`${chalk.blue('現在のプレイヤー:')} ${gameState.currentPlayer === 'O' ? chalk.green('O') : chalk.red('X')}`);
      playerMove();
      checkGameStatus();
      gameState.currentPlayer = gameState.currentPlayer === 'O' ? 'X' : 'O';
    }
  }
  
  // ゲーム終了時の処理
  renderBoard();
  if (gameState.winner) {
    console.log(`${chalk.yellow('勝者:')} ${gameState.winner === 'O' ? chalk.green('O') : chalk.red('X')}`);
  } else {
    console.log(chalk.yellow('引き分けです！'));
  }
  
  // もう一度プレイするか
  if (readlineSync.keyInYN('もう一度プレイしますか？')) {
    resetGame();
    startGame();
  } else {
    console.log(chalk.blue('プレイしていただきありがとうございました！'));
    process.exit();
  }
}

// ボードの描画
function renderBoard() {
  clear();
  console.log(chalk.yellow('〇×ゲーム（三目並べ）'));
  console.log('------------------------------');
  
  console.log('    0   1   2  ');
  console.log(`0   ${cellToString(0, 0)} | ${cellToString(0, 1)} | ${cellToString(0, 2)} `);
  console.log('   -----------');
  console.log(`1   ${cellToString(1, 0)} | ${cellToString(1, 1)} | ${cellToString(1, 2)} `);
  console.log('   -----------');
  console.log(`2   ${cellToString(2, 0)} | ${cellToString(2, 1)} | ${cellToString(2, 2)} `);
  console.log('');
}

// セルの内容を文字列に変換
function cellToString(row, col) {
  const cell = gameState.board[row][col];
  if (cell === 'O') {
    return chalk.green('O');
  } else if (cell === 'X') {
    return chalk.red('X');
  } else {
    return ' ';
  }
}

// プレイヤーの手
function playerMove() {
  let validMove = false;
  let row, col;
  
  while (!validMove) {
    console.log('手を打つ位置を入力してください（例: 1,2）');
    const input = readlineSync.question('> ');
    const coordinates = input.split(',').map(c => c.trim());
    
    if (coordinates.length !== 2) {
      console.log(chalk.red('無効な入力です。行と列をカンマで区切って入力してください。'));
      continue;
    }
    
    row = parseInt(coordinates[0]);
    col = parseInt(coordinates[1]);
    
    if (isNaN(row) || isNaN(col) || row < 0 || row > 2 || col < 0 || col > 2) {
      console.log(chalk.red('無効な位置です。行と列は0、1、2のいずれかを入力してください。'));
      continue;
    }
    
    if (gameState.board[row][col] !== ' ') {
      console.log(chalk.red('その位置にはすでに駒が置かれています。'));
      continue;
    }
    
    validMove = true;
  }
  
  gameState.board[row][col] = gameState.currentPlayer;
}

// CPUの手
function cpuMove() {
  // 勝てる手があれば打つ
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (gameState.board[row][col] === ' ') {
        gameState.board[row][col] = gameState.currentPlayer === 'O' ? 'X' : 'O';
        if (checkWinner()) {
          return;
        }
        gameState.board[row][col] = ' ';
      }
    }
  }
  
  // 相手が勝てる手を防ぐ
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (gameState.board[row][col] === ' ') {
        gameState.board[row][col] = gameState.currentPlayer;
        if (checkWinner()) {
          gameState.board[row][col] = ' ';
          gameState.board[row][col] = gameState.currentPlayer === 'O' ? 'X' : 'O';
          return;
        }
        gameState.board[row][col] = ' ';
      }
    }
  }
  
  // 中央があいていれば中央に置く
  if (gameState.board[1][1] === ' ') {
    gameState.board[1][1] = gameState.currentPlayer === 'O' ? 'X' : 'O';
    return;
  }
  
  // 角があいていれば角に置く
  const corners = [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2]
  ];
  
  const availableCorners = corners.filter(([row, col]) => gameState.board[row][col] === ' ');
  
  if (availableCorners.length > 0) {
    const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
    gameState.board[randomCorner[0]][randomCorner[1]] = gameState.currentPlayer === 'O' ? 'X' : 'O';
    return;
  }
  
  // それ以外のランダムな場所に置く
  const availableMoves = [];
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (gameState.board[row][col] === ' ') {
        availableMoves.push([row, col]);
      }
    }
  }
  
  if (availableMoves.length > 0) {
    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    gameState.board[randomMove[0]][randomMove[1]] = gameState.currentPlayer === 'O' ? 'X' : 'O';
  }
}

// ゲームの状態チェック
function checkGameStatus() {
  if (checkWinner()) {
    gameState.gameOver = true;
    gameState.winner = gameState.currentPlayer;
    return;
  }
  
  // 引き分けチェック
  let isDraw = true;
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (gameState.board[row][col] === ' ') {
        isDraw = false;
        break;
      }
    }
    if (!isDraw) break;
  }
  
  if (isDraw) {
    gameState.gameOver = true;
  }
}

// 勝者チェック
function checkWinner() {
  // 横の列をチェック
  for (let row = 0; row < 3; row++) {
    if (
      gameState.board[row][0] !== ' ' &&
      gameState.board[row][0] === gameState.board[row][1] &&
      gameState.board[row][1] === gameState.board[row][2]
    ) {
      return true;
    }
  }
  
  // 縦の列をチェック
  for (let col = 0; col < 3; col++) {
    if (
      gameState.board[0][col] !== ' ' &&
      gameState.board[0][col] === gameState.board[1][col] &&
      gameState.board[1][col] === gameState.board[2][col]
    ) {
      return true;
    }
  }
  
  // 対角線をチェック
  if (
    gameState.board[0][0] !== ' ' &&
    gameState.board[0][0] === gameState.board[1][1] &&
    gameState.board[1][1] === gameState.board[2][2]
  ) {
    return true;
  }
  
  if (
    gameState.board[0][2] !== ' ' &&
    gameState.board[0][2] === gameState.board[1][1] &&
    gameState.board[1][1] === gameState.board[2][0]
  ) {
    return true;
  }
  
  return false;
}

// ゲームのリセット
function resetGame() {
  gameState.board = [
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' ']
  ];
  gameState.currentPlayer = 'O';
  gameState.gameOver = false;
  gameState.winner = null;
}

// ゲーム開始
startGame();
