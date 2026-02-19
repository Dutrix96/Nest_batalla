import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET as string, //quizas no es lo correcto ponerlo como string pero no me gusta hardcodearlo
                                                            //aunque en el anterior lo hice...pero bueno
        });
    }

    validate(payload: any) {
        return payload;
    }
}
