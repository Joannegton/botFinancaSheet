export class AuthOutput {
  constructor(
    readonly accessToken: string,
    readonly refreshToken: string,
    readonly usuario: {
      id: string;
      phoneNumber: string;
      name?: string;
    },
  ) {}
}
