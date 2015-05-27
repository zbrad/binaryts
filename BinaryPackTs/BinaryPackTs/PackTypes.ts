module BinaryPackTs {

    export enum PackType {
        MaxPositiveFixedType = 0x80,
        MaxNegativeFixedType = 0x20,

        Fixed = 0xE0,
        Raw = 0xA0,
        String = 0xB0,
        Array = 0x90,
        Map = 0x80
    }

    export enum PackSize {
        Small = 0x0F,
        U16 = 0xFFFF,
        U32 = 0xFFFFFFFF
    }

    export enum PackCode {
        Null = 0xc0,
        Undefined = 0xc1,
        False = 0xc2,
        True = 0xc3,
        Float = 0xca,
        Double = 0xcb,
        U8 = 0xcc,
        U16 = 0xcd,
        U32 = 0xce,
        U64 = 0xcf,
        I8 = 0xd0,
        I16 = 0xd1,
        I32 = 0xd2,
        I64 = 0xd3,
        String16 = 0xd8,
        String32 = 0xd9,
        Raw16 = 0xda,
        Raw32 = 0xdb,
        Array16 = 0xdc,
        Array32 = 0xdd,
        Map16 = 0xde,
        Map32 = 0xdf
    }
}