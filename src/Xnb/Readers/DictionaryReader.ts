import BaseReader from "./BaseReader.ts";
import BufferReader from "../../BufferReader.ts";
import BufferWriter from "../../BufferWriter.ts";
import ReaderResolver from "../ReaderResolver.ts";
import UInt32Reader from "./UInt32Reader.ts";
import XnbError from "../../XnbError.ts";

/** Dictionary Reader */
class DictionaryReader<T> extends BaseReader<Record<string, T>> {
  key: BaseReader<string>;
  value: BaseReader<T>;

  /**
     * Constructor for DictionaryReader.
     * @constructor
     * @param key The BaseReader for the dictionary key.
     * @param value The BaseReader for the dictionary value.
     */
  constructor(key: BaseReader<string>, value: BaseReader<T>) {
    // verify key and value are specified
    if (key == undefined || value == undefined) {
      throw new XnbError(
        "Cannot create instance of DictionaryReader without Key and Value.",
      );
    }

    // call base constructor
    super();

    /** @type */
    this.key = key;
    /** @type */
    this.value = value;
  }

  /**
   * Reads Dictionary from buffer.
   * @param buffer Buffer to read from.
   * @param resolver ReaderResolver to read non-primitive types. 
   */
  read(buffer: BufferReader, resolver: ReaderResolver): Record<string, T> {
    // the dictionary to return
    let dictionary: Record<string, T> = {};

    // read in the size of the dictionary
    const uint32Reader = new UInt32Reader();
    const size = uint32Reader.read(buffer);

    // loop over the size of the dictionary and read in the data
    for (let i = 0; i < size; i++) {
      // get the key
      let key = this.key.isValueType()
        ? this.key.read(buffer)
        : resolver.read(buffer);
      // get the value
      let value = this.value.isValueType()
        ? this.value.read(buffer)
        : resolver.read(buffer);

      // assign KV pair to the dictionary
      dictionary[key] = value;
    }

    // return the dictionary object
    return dictionary;
  }

  /**
   * Writes Dictionary into buffer
   * @param buffer
   * @param data The data to parse for the 
   * @param resolver ReaderResolver to write non-primitive types
   * @returns Buffer instance with the data in it
   */
  write(
    buffer: BufferWriter,
    content: Record<string, T>,
    resolver: ReaderResolver,
  ): void {
    // write the index
    this.writeIndex(buffer, resolver);

    // write the amount of entries in the Dictionary
    buffer.writeUInt32(Object.keys(content).length);

    // loop over the entries
    for (let key of Object.keys(content)) {
      // write the key
      this.key.write(buffer, key, (this.key.isValueType() ? null : resolver));
      // write the value
      this.value.write(
        buffer,
        content[key],
        (this.value.isValueType() ? null : resolver),
      );
    }
  }

  isValueType() {
    return false;
  }

  get type() {
    return `Dictionary<${this.key.type},${this.value.type}>`;
  }
}

export default DictionaryReader;
