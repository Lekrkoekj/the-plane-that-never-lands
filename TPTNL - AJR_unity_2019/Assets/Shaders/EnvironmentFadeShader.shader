Shader "Custom/EnvironmentFadeShader"
{
    Properties
    {
        _Color    ("Tint (RGB only)", Color) = (1,1,1,0)
        _Darkness ("Darkness", Range(0,1)) = 1.0
        _Fill     ("Fill Amount", Range(0,1.5)) = 0.0
        _Softness ("Edge Softness", Range(0.0001, 1)) = 0.1
    }

    SubShader
    {
        Tags
        {
            // Transparent, but late enough to overlay environment
            "Queue"="Transparent+5"
            "RenderType"="Transparent"
            "IgnoreProjector"="True"
        }

        // Multiply blend (darkens what is behind)
        Blend DstColor Zero

        // IMPORTANT PART
        ZWrite Off
        ZTest Always   // <-- always draw on top of environment geometry
        Cull Off
        Lighting Off
        Fog { Mode Off }

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing

            #include "UnityCG.cginc"

            float4 _Color;
            float  _Darkness;
            float  _Fill;
            float  _Softness;

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv     : TEXCOORD0;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv  : TEXCOORD0;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            v2f vert (appdata v)
            {
                v2f o;

                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_OUTPUT(v2f, o);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);

                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv  = v.uv;
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                // UV.y: 0 = bottom pole, 1 = top pole
                float y = i.uv.y;

                // Soft edge around the fill height
                float edge0 = _Fill - _Softness;
                float edge1 = _Fill;

                // Mask = 1 below fill, 0 above
                float mask = 1.0 - smoothstep(edge0, edge1, y);

                // Multiply darkening
                float m = 1.0 - _Darkness * mask;
                float3 mulRGB = m * _Color.rgb;

                return float4(mulRGB, 0);
            }
            ENDCG
        }
    }
}
