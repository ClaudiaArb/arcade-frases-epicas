import "./styles/styles.css";
import { DatabaseService } from "./db/database";
import { PhraseModel } from "./models/PhraseModel";
import { AppView } from "./views/AppView";
import { PhraseController } from "./controllers/PhraseController";

async function bootstrap(): Promise<void> {
  const app = document.getElementById("app")!;
  try {
    const db = await DatabaseService.init();
    const model = new PhraseModel(db, { save: () => DatabaseService.save(), reset: () => DatabaseService.reset() });
    new PhraseController(model, new AppView(app)).init();
  } catch {
    app.innerHTML = `<p class="fatal">No se pudo iniciar la base de datos. Recarga la página.</p>`;
  }
}
bootstrap();
