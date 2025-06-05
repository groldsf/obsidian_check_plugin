import { Line } from "../Line";

export abstract class AbstractLine implements Line {

  // длина отступа
  protected indent: number;
  // текст после чекбокса
  protected listText: string;  

  constructor(indent:number, lineText: string){
    this.indent = indent;
    this.listText = lineText;
    
  }

  getIndent(): number {
    return this.indent;
  }

  getText(): string {
    return this.listText;
  }

  setText(lineText: string){
    this.listText = lineText;
  }

  abstract toResultText(): string;
}