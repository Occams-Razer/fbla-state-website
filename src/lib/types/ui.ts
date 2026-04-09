export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

export type FormErrorMap<TField extends string = string> = Partial<
  Record<TField, string>
>;
