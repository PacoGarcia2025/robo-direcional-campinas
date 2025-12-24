import { runDirecional } from "./robots/direcional.js";

console.log("Iniciando Robô Premium - Direcional Campinas");

runDirecional()
  .then(() => {
    console.log("Robô finalizado com sucesso");
  })
  .catch((err) => {
    console.error("Erro no robô:", err);
  });
