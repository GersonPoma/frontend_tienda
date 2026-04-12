import { Rol } from "./rol.model";

export interface Usuario {
    id: number,
    username: string,
    nombre: string | null,
    apellido: string | null,
    grupos: string[] | null,
    is_superuser: boolean
}

export interface CrearUsuario {
    username: string;
    password: string | null;
    grupo_id: number;
}