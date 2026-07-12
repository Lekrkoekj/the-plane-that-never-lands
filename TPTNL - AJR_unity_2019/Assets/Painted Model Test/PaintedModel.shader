Shader "BeatSaber/AdvancedQuadMultiply"
{
    Properties
    {
        _MainTex ("Global Texture (UVMap)", 2D) = "white" {}
        _MaskTex ("Brush Stroke Mask (StrokeUV)", 2D) = "white" {}
        _Cutoff ("Cutout Threshold", Range(0,1)) = 0.5
        _PaintStrength ("Paint Texture Strength", Range(0, 2)) = 1.0
        
        [Header(Randomization Settings)]
        _GridSize ("Randomization Step Size", Float) = 1.0
        _RotationPower ("Max Rotation Angle", Range(0, 360)) = 15.0
        _ScaleMin ("Min Scale Multiplier", Range(0.1, 1.0)) = 0.8
        _ScaleMax ("Max Scale Multiplier", Range(1.0, 2.0)) = 1.2
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Geometry" }
        
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            struct appdata {
                float4 vertex : POSITION;
                float2 uv0 : TEXCOORD0; 
                float2 uv1 : TEXCOORD1; 
            };

            struct v2f {
                float4 pos : SV_POSITION;
                float2 uvGlobal : TEXCOORD0;
                float2 uvLocal : TEXCOORD1;
            };

            sampler2D _MainTex, _MaskTex;
            float _Cutoff, _GridSize, _RotationPower, _ScaleMin, _ScaleMax, _PaintStrength;

            float hash13(float3 p3) {
                p3  = frac(p3 * .1031);
                p3 += dot(p3, p3.yzx + 33.33);
                return frac((p3.x + p3.y) * p3.z);
            }

            v2f vert (appdata v) {
                v2f o;
                float3 worldPos = mul(unity_ObjectToWorld, v.vertex).xyz;
                float3 snappedPos = floor(worldPos / _GridSize) * _GridSize;
                float randValue = hash13(snappedPos);

                // Scale
                float scale = lerp(_ScaleMin, _ScaleMax, randValue);
                float2 scaledUV = (v.uv1 - 0.5) * (1.0 / scale) + 0.5;

                // Rotation
                float angle = (randValue * 2.0 - 1.0) * (_RotationPower * (3.14159 / 180.0));
                float s = sin(angle); float c = cos(angle);
                float2x2 rotMatrix = float2x2(c, -s, s, c);
                
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uvGlobal = v.uv0;
                o.uvLocal = mul(rotMatrix, scaledUV - 0.5) + 0.5;
                return o;
            }

            fixed4 frag (v2f i) : SV_Target {
                // 1. Discard if UVs are out of bounds (clean edges)
                if (any(i.uvLocal < 0) || any(i.uvLocal > 1)) discard;

                // 2. Sample the brush stroke
                fixed4 mask = tex2D(_MaskTex, i.uvLocal);

                // 3. Clip based on the threshold
                clip(mask.r - _Cutoff);

                // 4. Sample original global texture
                fixed4 col = tex2D(_MainTex, i.uvGlobal);

                // 5. MULTIPLY logic
                // We use the mask's color to influence the original texture.
                // lerp allows you to control how much the paint "texture" shows up.
                float3 paintEffect = col.rgb * mask.rgb * _PaintStrength;
                col.rgb = lerp(col.rgb, paintEffect, _PaintStrength);

                return fixed4(col.rgb, 1.0);
            }
            ENDCG
        }
    }
}