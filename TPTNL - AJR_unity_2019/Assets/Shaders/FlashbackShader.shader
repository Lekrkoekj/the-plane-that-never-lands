// Upgrade NOTE: replaced '_Object2World' with 'unity_ObjectToWorld'

Shader "Unlit Flashback Cutout"
{
    Properties
    {
        _Color ("Color Day", Color) = (1,1,1,1)
        _ColorNight ("Color Night", Color) = (1,1,1,1)
        _Bloom ("Glow", Range (0, 1)) = 0
        _DitherMaskScale("Dither Mask Scale", Float) = 40
        _DitherMask("Dither Mask", 2D) = "black" {}
        _Alpha("Alpha", Float) = 1
        _Cutout ("Cutout", Range (0, 1)) = 0.5
        _DayNightCycle("Day/Night Cycle", Range(0, 1)) = 1

        // Vignette Properties
        _VignetteColor ("Vignette Color", Color) = (1,1,1,1)
        _VignetteSize ("Vignette Size", Range(0, 2)) = 0.8
        _VignetteSmoothness ("Vignette Smoothness", Range(0.001, 1)) = 0.1

        _Tex ("Texture 1", 2D) = "white" {}
        _Tex2 ("Texture 2", 2D) = "white" {}
        _Tex3 ("Texture 3", 2D) = "white" {}
        _Tex4 ("Texture 4", 2D) = "white" {}
        _Tex5 ("Texture 5", 2D) = "white" {}
        _Tex6 ("Texture 6", 2D) = "white" {}
        _Tex7 ("Texture 7", 2D) = "white" {}
        _Tex8 ("Texture 8", 2D) = "white" {}
        _Tex9 ("Texture 9", 2D) = "white" {}
        _Tex10 ("Texture 10", 2D) = "white" {}
        _Tex11 ("Texture 11", 2D) = "white" {}
        _Tex12 ("Texture 12", 2D) = "white" {}
        _Tex13 ("Texture 13", 2D) = "white" {}
        _Tex14 ("Texture 14", 2D) = "white" {}
        _Tex15 ("Texture 15", 2D) = "white" {}
        _Tex16 ("Texture 16", 2D) = "white" {}
        _Tex17 ("Texture 17", 2D) = "white" {}
        _Tex18 ("Texture 18", 2D) = "white" {}
        _Tex19 ("Texture 19", 2D) = "white" {}
        _Tex20 ("Texture 20", 2D) = "white" {}
        _Tex21 ("Texture 21", 2D) = "white" {}
        _Tex22 ("Texture 22", 2D) = "white" {}
        _Tex23 ("Texture 23", 2D) = "white" {}
        _Tex24 ("Texture 24", 2D) = "white" {}
        _Tex25 ("Texture 25", 2D) = "white" {}
        _Tex26 ("Texture 26", 2D) = "white" {}
        _Tex27 ("Texture 27", 2D) = "white" {}
        _Tex28 ("Texture 28", 2D) = "white" {}
        _Tex29 ("Texture 29", 2D) = "white" {}
        _Tex30 ("Texture 30", 2D) = "white" {}
    }
    SubShader
    {
        Tags { "RenderType"="Opaque"}
        LOD 100
        Cull Off

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                fixed4 color : COLOR;
                float2 uv : TEXCOORD0;

                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 scrPos : TEXCOORD1;
                float4 vertex : SV_POSITION;
                half4 color : COLOR;
                
                UNITY_VERTEX_OUTPUT_STEREO
            };

            float4 _Color;
            float4 _ColorNight;
            float _Bloom;
            sampler2D _DitherMask;
            float _DitherMaskScale;
            float _Alpha;
            float _Cutout;
            float _DayNightCycle;

            // Vignette uniforms
            float4 _VignetteColor;
            float _VignetteSize;
            float _VignetteSmoothness;

            // so many textures lmao
            Texture2D _Tex;   Texture2D _Tex2;  Texture2D _Tex3;  Texture2D _Tex4;  Texture2D _Tex5;
            Texture2D _Tex6;   Texture2D _Tex7;  Texture2D _Tex8;  Texture2D _Tex9;  Texture2D _Tex10;
            Texture2D _Tex11;  Texture2D _Tex12; Texture2D _Tex13; Texture2D _Tex14; Texture2D _Tex15;
            Texture2D _Tex16;  Texture2D _Tex17; Texture2D _Tex18; Texture2D _Tex19; Texture2D _Tex20;
            Texture2D _Tex21;  Texture2D _Tex22; Texture2D _Tex23; Texture2D _Tex24; Texture2D _Tex25;
            Texture2D _Tex26;  Texture2D _Tex27; Texture2D _Tex28; Texture2D _Tex29; Texture2D _Tex30;

            float4 _Tex_ST;
            SamplerState sampler_Tex;
            
            v2f vert (appdata_full v)
            {
                v2f o;

                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_OUTPUT(v2f, o);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = v.texcoord;
                o.color = v.color;
                o.scrPos = ComputeScreenPos(v.vertex);
                return o;
            }
            
            fixed4 frag (v2f i) : SV_Target
            {
                float steppedTime = floor(_Time.y * 10.0);
                int frameIndex = (int)fmod(steppedTime, 30.0);

                // Compute the shared UV coordinates once up front
                float2 sharedUV = TRANSFORM_TEX(i.uv, _Tex);

                fixed4 texSample = fixed4(1,1,1,1);
                
                // Binary tree to sample textures using the shared sampler state
                if (frameIndex < 15)
                {
                    if (frameIndex < 8)
                    {
                        if (frameIndex < 4)
                        {
                            if (frameIndex == 0)      texSample = _Tex.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 1) texSample = _Tex2.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 2) texSample = _Tex3.Sample(sampler_Tex, sharedUV);
                            else                      texSample = _Tex4.Sample(sampler_Tex, sharedUV);
                        }
                        else
                        {
                            if (frameIndex == 4)      texSample = _Tex5.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 5) texSample = _Tex6.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 6) texSample = _Tex7.Sample(sampler_Tex, sharedUV);
                            else                      texSample = _Tex8.Sample(sampler_Tex, sharedUV);
                        }
                    }
                    else
                    {
                        if (frameIndex < 12)
                        {
                            if (frameIndex == 8)      texSample = _Tex9.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 9) texSample = _Tex10.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 10) texSample = _Tex11.Sample(sampler_Tex, sharedUV);
                            else                       texSample = _Tex12.Sample(sampler_Tex, sharedUV);
                        }
                        else
                        {
                            if (frameIndex == 12)     texSample = _Tex13.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 13) texSample = _Tex14.Sample(sampler_Tex, sharedUV);
                            else                       texSample = _Tex15.Sample(sampler_Tex, sharedUV);
                        }
                    }
                }
                else
                {
                    if (frameIndex < 23)
                    {
                        if (frameIndex < 19)
                        {
                            if (frameIndex == 15)     texSample = _Tex16.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 16) texSample = _Tex17.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 17) texSample = _Tex18.Sample(sampler_Tex, sharedUV);
                            else                       texSample = _Tex19.Sample(sampler_Tex, sharedUV);
                        }
                        else
                        {
                            if (frameIndex == 19)     texSample = _Tex20.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 20) texSample = _Tex21.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 21) texSample = _Tex22.Sample(sampler_Tex, sharedUV);
                            else                       texSample = _Tex23.Sample(sampler_Tex, sharedUV);
                        }
                    }
                    else
                    {
                        if (frameIndex < 27)
                        {
                            if (frameIndex == 23)     texSample = _Tex24.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 24) texSample = _Tex25.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 25) texSample = _Tex26.Sample(sampler_Tex, sharedUV);
                            else                       texSample = _Tex27.Sample(sampler_Tex, sharedUV);
                        }
                        else
                        {
                            if (frameIndex == 27)     texSample = _Tex28.Sample(sampler_Tex, sharedUV);
                            else if (frameIndex == 28) texSample = _Tex29.Sample(sampler_Tex, sharedUV);
                            else                       texSample = _Tex30.Sample(sampler_Tex, sharedUV);
                        }
                    }
                }

                // Apply remaining color/cutout/dither math
                fixed4 col = ((_Color * _DayNightCycle) + (_ColorNight * (1.0 - _DayNightCycle))) * texSample;

                if (col.a < _Cutout) discard;

                float4 ase_screenPos = float4(i.scrPos.xyz, i.scrPos.w + 0.00000000001);
                float4 ase_screenPosNorm = ase_screenPos / ase_screenPos.w;

                if (tex2D(_DitherMask, ase_screenPosNorm.xy * _ScreenParams.xy * _DitherMaskScale).r >= _Alpha * i.color.a) discard;

                // --- Rectangular UV Vignette Calculation (16:9 Aware) ---
                // Calculate distance from center (0.5, 0.5) scaled to 16:9 box bounds
                float2 d = abs(sharedUV - 0.5) * 2.0;
                
                // Determine edge boundary coordinates based on custom aspect ratio
                float edgeFactor = max(d.x, d.y);
                
                // Calculate the blend factor via smoothstep transition
                float vignetteFactor = smoothstep(_VignetteSize - _VignetteSmoothness, _VignetteSize, edgeFactor);
                
                // Blend colors directly without modifying alpha
                col.rgb = lerp(col.rgb, _VignetteColor.rgb, vignetteFactor);

                col *= float4(i.color.rgb, 0.0);
                col.a = _Bloom;

                return col;
            }
            ENDCG
        }
    }
}