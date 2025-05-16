class HtmlBuilder {
  constructor() {
    this.blocks = [];
  }

  add(block) {
    if (block) this.blocks.push(block);
    return this;
  }

  build() {
    return this.blocks.join('');
  }
}

export default HtmlBuilder;