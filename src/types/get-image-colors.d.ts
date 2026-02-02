declare module "get-image-colors" {
  interface GetColorsOptions {
    count?: number;
    type?: string;
  }
  interface ChromaColor {
    hex(): string;
  }
  function getColors(
    input: Buffer | string,
    options?: GetColorsOptions | string
  ): Promise<ChromaColor[]>;
  export default getColors;
}
